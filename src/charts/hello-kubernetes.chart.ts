import { Construct } from 'constructs';
import { Chart, ChartProps } from 'cdk8s';
import { ImagePullPolicy, Protocol } from 'cdk8s-plus-22/lib/container';
import {
    IntOrString,
    KubeDeployment,
    KubeService,
    KubeServiceAccount,
    KubeIngress,
    IngressTls,
    KubeSecret,
} from '../imports/k8s';
import { HttpIngressPathType, ServiceType } from 'cdk8s-plus-22';
import {
    ExternalSecret,
    SecretStore,
    SecretStoreSpecProviderAwsService,
} from '../imports/external-secrets.io';
import { ClusterIssuer } from '../imports/cert-manager.io';
import { NetworkAttachmentDefinition } from '../imports/k8s.cni.cncf.io';

export type HelloKubernetesConfig = {
    containerPort: number;
    image: string;
    host: string;
};

interface HelloKubernetesProps extends ChartProps, Partial<HelloKubernetesConfig> {
    clusterIssuer?: ClusterIssuer;
}

export class HelloKubernetes extends Chart {
    constructor(scope: Construct, id: string, props: HelloKubernetesProps = {}) {
        super(scope, id, props);

        const { containerPort, image, host } = parseInputs(props);

        const { clusterIssuer } = props;

        const selector = {
            matchLabels: this.labels,
        };

        const secretStore = new SecretStore(this, 'secret-store', {
            spec: {
                provider: {
                    aws: {
                        region: 'ap-southeast-2',
                        service: SecretStoreSpecProviderAwsService.PARAMETER_STORE,
                        auth: {
                            secretRef: {
                                accessKeyIdSecretRef: {
                                    name: 'awssm-secret',
                                    key: 'access-key',
                                },
                                secretAccessKeySecretRef: {
                                    name: 'awssm-secret',
                                    key: 'secret-access-key',
                                },
                            },
                        },
                    },
                },
            },
        });

        const externalSecret = new ExternalSecret(this, 'secret', {
            spec: {
                secretStoreRef: {
                    name: secretStore.name,
                    kind: 'SecretStore',
                },
                target: {},
                data: [
                    {
                        secretKey: 'MESSAGE',
                        remoteRef: {
                            key: 'MESSAGE',
                        },
                    },
                ],
                refreshInterval: '999h',
            },
        });

        new NetworkAttachmentDefinition(this, 'NetworkAttachmentDefinition', {
            spec: {
                config: ``,
            },
        });

        const serviceAccount = new KubeServiceAccount(this, 'service-account');

        new KubeDeployment(this, 'deployment', {
            spec: {
                selector,
                replicas: 1,
                template: {
                    spec: {
                        serviceAccountName: serviceAccount.name,
                        containers: [
                            {
                                name: this.labels['chart'],
                                image,
                                imagePullPolicy: ImagePullPolicy.IF_NOT_PRESENT,
                                ports: [
                                    {
                                        name: 'http',
                                        protocol: Protocol.TCP,
                                        containerPort,
                                    },
                                ],
                                livenessProbe: {
                                    httpGet: {
                                        port: IntOrString.fromNumber(containerPort),
                                    },
                                },
                                readinessProbe: {
                                    httpGet: {
                                        port: IntOrString.fromNumber(containerPort),
                                    },
                                },
                                env: [
                                    {
                                        name: 'PORT',
                                        value: `${containerPort}`,
                                    },
                                    {
                                        name: 'MESSAGE',
                                        valueFrom: {
                                            secretKeyRef: {
                                                key: 'MESSAGE',
                                                name: externalSecret.name,
                                            },
                                        },
                                    },
                                    {
                                        name: 'KUBERNETES_NAMESPACE',
                                        valueFrom: {
                                            fieldRef: {
                                                fieldPath: 'metadata.namespace',
                                            },
                                        },
                                    },
                                    {
                                        name: 'KUBERNETES_POD_NAME',
                                        valueFrom: {
                                            fieldRef: {
                                                fieldPath: 'metadata.name',
                                            },
                                        },
                                    },
                                    {
                                        name: 'KUBERNETES_NODE_NAME',
                                        valueFrom: {
                                            fieldRef: {
                                                fieldPath: 'spec.nodeName',
                                            },
                                        },
                                    },
                                    {
                                        name: 'CONTAINER_IMAGE',
                                        value: image,
                                    },
                                ],
                            },
                        ],
                    },
                },
            },
        });

        const service = new KubeService(this, 'service', {
            spec: {
                selector: this.labels,
                type: ServiceType.LOAD_BALANCER,
                ports: [
                    {
                        port: containerPort,
                        name: 'http',
                    },
                ],
            },
        });

        const annotations: { [key: string]: string } = {
            'kubernetes.io/ingress.class': 'traefik',
            'traefik.ingress.kubernetes.io/router.tls': 'false',
        };

        let tls: IngressTls[] | undefined;

        if (typeof clusterIssuer !== 'undefined') {
            annotations['traefik.ingress.kubernetes.io/router.tls'] = 'true';
            annotations['cert-manager.io/cluster-issuer'] = clusterIssuer.name;

            const secret = new KubeSecret(this, 'Secret-TLS');

            tls = [
                {
                    hosts: [host],
                    secretName: secret.name,
                },
            ];
        }

        new KubeIngress(this, 'ingress', {
            metadata: {
                annotations,
            },
            spec: {
                rules: [
                    {
                        http: {
                            paths: [
                                {
                                    pathType: HttpIngressPathType.PREFIX,
                                    backend: {
                                        service: {
                                            name: service.name,
                                            port: {
                                                number: containerPort,
                                            },
                                        },
                                    },
                                    path: '/',
                                },
                            ],
                        },
                        host,
                    },
                ],
                tls,
            },
        });
    }
}

export const parseInputs = (props: Partial<HelloKubernetesConfig>): HelloKubernetesConfig => {
    return {
        containerPort: props.containerPort ?? 8080,
        image: props.image ?? 'paulbouwer/hello-kubernetes:1.10.1',
        host: props.host ?? 'test.h6020-001.devops-at-ho.me',
    };
};
