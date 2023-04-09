// From: https://github.com/AbsaOSS/cert-manager-webhook-externaldns/tree/master/manifest

import { Chart, ChartProps } from 'cdk8s';
import { Construct } from 'constructs';
import {
    IntOrString,
    KubeApiService,
    KubeClusterRole,
    KubeClusterRoleBinding,
    KubeDeployment,
    KubeRoleBinding,
    KubeService,
    KubeServiceAccount,
} from '../imports/k8s';
import { Certificate, Issuer } from '../imports/cert-manager.io';
import { ConnectionScheme, Protocol } from 'cdk8s-plus-22';

export type CertManagerWebhookExternalDnsConfig = {
    domain: string;
};

interface CertManagerWebhookExternalDnsProps
    extends ChartProps,
        Partial<CertManagerWebhookExternalDnsConfig> {}

export class CertManagerWebhookExternalDns extends Chart {
    constructor(scope: Construct, id: string, props: CertManagerWebhookExternalDnsProps) {
        super(scope, id, props);

        const { domain } = parseInputs(props);

        const name = this.labels['chart'] ?? 'externaldns-webhook';

        const serviceAccount = new KubeServiceAccount(this, 'webhook-serviceaccount');

        const service = new KubeService(this, 'service', {
            spec: {
                type: 'ClusterIP',
                ports: [
                    {
                        port: 443,
                        protocol: Protocol.TCP,
                        name: 'https',
                    },
                ],
                selector: this.labels,
            },
        });

        new KubeApiService(this, 'KubeApiService', {
            metadata: {
                name: `v1alpha1.${domain}`,
                annotations: {
                    'cert-manager.io/inject-ca-from': `${this.namespace!}/${name}-tls`,
                },
            },
            spec: {
                group: domain,
                groupPriorityMinimum: 1000,
                versionPriority: 15,
                version: 'v1alpha1',
                service: { name: service.name, namespace: this.namespace! },
            },
        });

        // Create a selfsigned Issuer, in order to create a root CA certificate for
        // signing webhook serving certificates
        const issuerSelfSign = new Issuer(this, 'issuer-webhook-selfsign', {
            spec: {
                selfSigned: {},
            },
        });

        // Create an Issuer that uses the above generated CA certificate to issue certs
        const issuerCa = new Issuer(this, 'issuer-webhook-ca', {
            spec: {
                ca: {
                    secretName: `${name}-ca`,
                },
            },
        });

        new Certificate(this, 'webhook-ca', {
            spec: {
                secretName: `${name}-ca`,
                duration: '43800h', // 5y
                issuerRef: {
                    name: issuerSelfSign.name,
                },
                commonName: `ca.${name}.${this.namespace!}`,
                isCa: true,
            },
        });

        new KubeDeployment(this, 'webhook-deployment', {
            spec: {
                replicas: 1,
                selector: {
                    matchLabels: this.labels,
                },
                template: {
                    spec: {
                        serviceAccountName: serviceAccount.name,
                        volumes: [
                            {
                                name: 'certs',
                                secret: {
                                    secretName: `${name}-tls`,
                                },
                            },
                        ],
                        containers: [
                            {
                                image: 'absaoss/cert-manager-webhook-externaldns:dev',
                                name,
                                args: [
                                    '--tls-cert-file=/tls/tls.crt',
                                    '--tls-private-key-file=/tls/tls.key',
                                ],
                                env: [
                                    {
                                        name: 'GROUP_NAME',
                                        value: domain,
                                    },
                                ],
                                ports: [
                                    {
                                        name: 'https',
                                        containerPort: 443,
                                        protocol: Protocol.TCP,
                                    },
                                ],
                                livenessProbe: {
                                    httpGet: {
                                        scheme: ConnectionScheme.HTTPS,
                                        path: '/healthz',
                                        port: IntOrString.fromNumber(443),
                                    },
                                },
                                readinessProbe: {
                                    httpGet: {
                                        scheme: ConnectionScheme.HTTPS,
                                        path: '/healthz',
                                        port: IntOrString.fromNumber(443),
                                    },
                                },
                                volumeMounts: [
                                    {
                                        name: 'certs',
                                        mountPath: '/tls',
                                        readOnly: true,
                                    },
                                ],
                            },
                        ],
                    },
                },
            },
        });

        const clusterRole = new KubeClusterRole(this, 'cluster-role', {
            rules: [
                {
                    apiGroups: ['externaldns.k8s.io'],
                    resources: ['dnsendpoints'],
                    verbs: ['create', 'list', 'delete'],
                },
                {
                    apiGroups: ['flowcontrol.apiserver.k8s.io'],
                    resources: ['flowschemas', 'prioritylevelconfigurations'],
                    verbs: ['list', 'watch'],
                },
            ],
        });

        // Grant the webhook permission to read the ConfigMap containing the Kubernetes
        // apiserver's requestheader-ca-certificate.
        // This ConfigMap is automatically created by the Kubernetes apiserver.
        new KubeRoleBinding(this, 'role-binding-reader', {
            metadata: {
                name: `${name}:webhook-authentication-reader`,
                namespace: 'kube-system',
            },
            roleRef: {
                apiGroup: 'rbac.authorization.k8s.io',
                kind: 'Role',
                name: 'extension-apiserver-authentication-reader',
            },
            subjects: [
                {
                    apiGroup: '',
                    kind: 'ServiceAccount',
                    name: serviceAccount.name,
                    namespace: this.namespace!,
                },
            ],
        });

        // apiserver gets the auth-delegator role to delegate auth decisions to
        // the core apiserver
        new KubeClusterRoleBinding(this, 'cluster-role-binding', {
            metadata: {
                name: `${name}:auth-delegator`,
            },
            roleRef: {
                apiGroup: 'rbac.authorization.k8s.io',
                kind: 'ClusterRole',
                name: 'system:auth-delegator',
            },
            subjects: [
                {
                    apiGroup: '',
                    kind: 'ServiceAccount',
                    name: serviceAccount.name,
                    namespace: this.namespace!,
                },
            ],
        });

        new KubeClusterRoleBinding(this, 'role-binding-flowcontrol', {
            metadata: {
                name: `${name}:flowcontrol`,
            },
            roleRef: {
                apiGroup: 'rbac.authorization.k8s.io',
                kind: 'ClusterRole',
                name: clusterRole.name,
            },
            subjects: [
                {
                    apiGroup: '',
                    kind: 'ServiceAccount',
                    name: serviceAccount.name,
                    namespace: this.namespace!,
                },
            ],
        });

        // Serving certificate for the webhook to use
        new Certificate(this, 'tls', {
            spec: {
                secretName: `${name}-tls`,
                duration: '8760h', // 1y
                issuerRef: {
                    name: issuerCa.name,
                },
                dnsNames: [
                    name,
                    `${name}.${this.namespace!}`,
                    `${name}.${this.namespace!}.svc`,
                    `${name}.${this.namespace!}.svc.cluster.local`,
                ],
            },
        });
    }
}

export const parseInputs = (
    props: Partial<CertManagerWebhookExternalDnsConfig>
): CertManagerWebhookExternalDnsConfig => {
    return {
        domain: props.domain ?? 'example.com',
    };
};
