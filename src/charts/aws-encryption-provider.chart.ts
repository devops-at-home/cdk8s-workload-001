import { Construct } from 'constructs';
import { Chart, ChartProps } from 'cdk8s';
import { ImagePullPolicy, Protocol } from 'cdk8s-plus-22/lib/container';
import { IntOrString, KubeDeployment, KubeServiceAccount } from '../imports/k8s';

export type AwsEncryptionProviderConfig = {
    name: string;
    containerPort: number;
    region: string;
    image: string;
    key: string;
};

export interface AwsEncryptionProviderProps
    extends ChartProps,
        Partial<AwsEncryptionProviderConfig> {
    ecr?: boolean;
    account?: string;
}

export class AwsEncryptionProvider extends Chart {
    constructor(scope: Construct, id: string, props: AwsEncryptionProviderProps = {}) {
        super(scope, id, props);

        const { name, containerPort, image, region, key } = parseInputs(props);

        const labels = { 'app.kubernetes.io/name': name };

        const metadata = {
            name,
            labels,
            namespace: 'kube-system',
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
                        // TODO: This can be removed when image is public
                        imagePullSecrets: [
                            {
                                name: 'ecrauth',
                            },
                        ],
                        containers: [
                            {
                                name,
                                image,
                                imagePullPolicy: ImagePullPolicy.IF_NOT_PRESENT,
                                command: [
                                    '/aws-encryption-provider',
                                    `--key=${key}`,
                                    `--region=${region}`,
                                    '--listen=/var/run/kmsplugin/socket.sock',
                                ],
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
                                        path: '/healthz',
                                    },
                                },
                                volumeMounts: [
                                    {
                                        mountPath: '/var/run/kmsplugin',
                                        name: 'var-run-kmsplugin',
                                    },
                                    {
                                        mountPath: '/root/.aws',
                                        name: 'awsssm',
                                    },
                                ],
                            },
                        ],
                        volumes: [
                            {
                                name: 'var-run-kmsplugin',
                                hostPath: {
                                    path: '/var/run/kmsplugin',
                                    type: 'DirectoryOrCreate',
                                },
                            },
                            {
                                name: 'awsssm',
                                hostPath: {
                                    path: '/root/.aws',
                                },
                            },
                        ],
                    },
                },
            },
        });
    }
}

export const parseInputs = (props: AwsEncryptionProviderProps): AwsEncryptionProviderConfig => {
    const ecr = props.ecr ?? true;
    const image = props.image ?? 'aws-encryption-provider:latest';
    const region = props.region ?? 'ap-southeast-2';
    const account = props.account ?? '012345678901';
    const key = props.key ?? 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

    return {
        name: props.name ?? 'aws-encryption-provider',
        containerPort: props.containerPort ?? 8080,
        image: ecr ? `${account}.dkr.ecr.${region}.amazonaws.com/${image}` : image,
        region,
        key: `arn:aws:kms:${region}:${account}:key/${key}`,
    };
};
