import { Construct } from 'constructs';
import { App, Chart, ChartProps } from 'cdk8s';
import { ImagePullPolicy, Protocol } from 'cdk8s-plus-22/lib/container';
import { KubeDeployment, KubeService, KubeServiceAccount } from '../lib/imports/k8s';
import { ServiceType } from 'cdk8s-plus-22';

export class HelloKubernetes extends Chart {
    constructor(scope: Construct, id: string, props: ChartProps = {}) {
        super(scope, id, props);

        const name = 'hello-kubernetes';

        const labels = { 'app.kubernetes.io/name': name };

        const metadata = {
            name,
            labels,
        };

        const selector = {
            matchLabels: labels,
        };

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
                                image: 'paulbouwer/hello-kubernetes:1.10.1',
                                imagePullPolicy: ImagePullPolicy.IF_NOT_PRESENT,
                                ports: [
                                    {
                                        name: 'http',
                                        protocol: Protocol.TCP,
                                        containerPort: 8080,
                                    },
                                ],
                                livenessProbe: {
                                    httpGet: {
                                        port: {
                                            value: 8080,
                                        },
                                    },
                                },
                                readinessProbe: {
                                    httpGet: {
                                        port: {
                                            value: 8080,
                                        },
                                    },
                                },
                                env: [
                                    {
                                        name: 'PORT',
                                        value: '8080',
                                    },
                                    {
                                        name: 'MESSAGE',
                                        value: 'Message goes here',
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
                                                fieldPath: 'metadata.nodeName',
                                            },
                                        },
                                    },
                                    {
                                        name: 'CONTAINER_IMAGE',
                                        value: 'paulbouwer/hello-kubernetes:1.10.1',
                                    },
                                ],
                            },
                        ],
                    },
                },
            },
        });

        new KubeService(this, 'service', {
            metadata,
            spec: {
                selector: labels,
                type: ServiceType.LOAD_BALANCER,
                ports: [
                    {
                        port: 8080,
                        name: 'http',
                    },
                ],
            },
        });
    }
}

const app = new App();

new HelloKubernetes(app, 'HelloKubernetes');

app.synth();
