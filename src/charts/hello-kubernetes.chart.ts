import { Construct } from 'constructs';
import { Chart, ChartProps } from 'cdk8s';
import { ImagePullPolicy, Protocol } from 'cdk8s-plus-22/lib/container';
import { IntOrString, KubeDeployment, KubeService, KubeServiceAccount } from '../imports/k8s';
import { HttpIngressPathType, ServiceType } from 'cdk8s-plus-22';
import { KubeIngress } from 'cdk8s-plus-22/lib/imports/k8s';
import {
    ExternalSecret,
    SecretStore,
    SecretStoreSpecProviderAwsService,
} from '../imports/external-secrets.io';

export type HelloKubernetesConfig = {
    name: string;
    containerPort: number;
    image: string;
    sslRedirect: boolean;
    host: string;
};

interface HelloKubernetesProps extends ChartProps, Partial<HelloKubernetesConfig> {}

export class HelloKubernetes extends Chart {
    constructor(scope: Construct, id: string, props: HelloKubernetesProps = {}) {
        super(scope, id, props);

        const { name, containerPort, image, sslRedirect, host } = parseInputs(props);

        const labels = { 'app.kubernetes.io/name': name };

        const metadata = {
            name,
            labels,
        };

        const selector = {
            matchLabels: labels,
        };

        new SecretStore(this, 'secret-store', {
            metadata,
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

        new ExternalSecret(this, 'secret', {
            metadata,
            spec: {
                secretStoreRef: {
                    name,
                    kind: 'SecretStore',
                },
                target: {
                    name,
                },
                data: [
                    {
                        secretKey: 'MESSAGE',
                        remoteRef: {
                            key: 'MESSAGE',
                            // version: 'provider-key-version',
                            // property: 'provider-key-property',
                        },
                    },
                ],
                // dataFrom: [
                //     {
                //         key: 'MESSAGE',
                //     },
                // ],
                refreshInterval: '999h',
            },
        });

        const serviceAccount = new KubeServiceAccount(this, 'serviceAccount', {
            metadata,
        });

        new KubeDeployment(this, 'deployment', {
            metadata,
            spec: {
                selector,
                replicas: 1,
                template: {
                    metadata,
                    spec: {
                        serviceAccountName: serviceAccount.name,
                        containers: [
                            {
                                name,
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
                                                name,
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
            metadata,
            spec: {
                selector: labels,
                type: ServiceType.LOAD_BALANCER,
                ports: [
                    {
                        port: containerPort,
                        name: 'http',
                    },
                ],
            },
        });

        new KubeIngress(this, 'ingress', {
            metadata: {
                ...metadata,
                annotations: {
                    'kubernetes.io/ingress.class': 'traefik',
                    'traefik.ingress.kubernetes.io/router.tls': `${sslRedirect}`,
                },
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
            },
        });
    }
}

export const parseInputs = (props: Partial<HelloKubernetesConfig>): HelloKubernetesConfig => {
    return {
        name: props.name ?? 'hello-kubernetes',
        containerPort: props.containerPort ?? 8080,
        image: props.image ?? 'paulbouwer/hello-kubernetes:1.10.1',
        sslRedirect: props.sslRedirect ?? false,
        host: props.host ?? 'test.h6020-001.devops-at-ho.me',
    };
};
