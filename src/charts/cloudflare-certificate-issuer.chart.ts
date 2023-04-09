import { Chart, ChartProps } from 'cdk8s';
import { Construct } from 'constructs';
import {
    ClusterIssuer,
    ClusterIssuerSpecAcmeSolversDns01Cloudflare,
} from '../imports/cert-manager.io';

interface CloudflareCertificateIssuerProps extends ChartProps {
    environment: 'staging' | 'production';
    cloudflare: ClusterIssuerSpecAcmeSolversDns01Cloudflare;
}

export class CloudflareCertificateIssuer extends Chart {
    public readonly clusterIssuer: ClusterIssuer;
    constructor(scope: Construct, id: string, props: CloudflareCertificateIssuerProps) {
        super(scope, id, props);

        const { cloudflare } = props;

        this.clusterIssuer = new ClusterIssuer(this, 'cloudflare-staging', {
            spec: {
                acme: {
                    server: 'https://acme-staging-v02.api.letsencrypt.org/directory',
                    privateKeySecretRef: {
                        name: 'letsencrypt-staging',
                    },
                    solvers: [
                        {
                            dns01: {
                                cloudflare,
                            },
                        },
                    ],
                },
            },
        });
    }
}
