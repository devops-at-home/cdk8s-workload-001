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

interface CertManagerWebhookExternalDnsProps extends ChartProps {
    domain: string;
}

export class CertManagerWebhookExternalDns extends Chart {
    constructor(scope: Construct, id: string, props: Partial<CertManagerWebhookExternalDnsProps>) {
        super(scope, id, props);

        const { domain } = parseInputs(props);

        new KubeApiService(this, 'KubeApiService', {
            metadata: {
                name: `v1alpha1.${domain}`,
                labels: {
                    app: 'externaldns-webhook',
                },
                annotations: {
                    'cert-manager.io/inject-ca-from': 'cert-manager/externaldns-webhook-tls',
                },
            },
            spec: {
                group: domain,
                groupPriorityMinimum: 1000,
                versionPriority: 15,
                version: 'v1alpha1',
                service: { name: 'externaldns-webhook', namespace: this.namespace! },
            },
        });

        new Certificate(this, 'CaCert', {
            metadata: {
                name: 'externaldns-webhook-ca',
                labels: { app: 'externaldns-webhook' },
            },
            spec: {
                secretName: 'externaldns-webhook-ca',
                duration: '43800h', // 5y
                issuerRef: {
                    name: 'externaldns-webhook-selfsign',
                },
                commonName: 'ca.externaldns-webhook.cert-manager',
                isCa: true,
            },
        });

        new KubeDeployment(this, 'Deployment', {
            metadata: {
                labels: {
                    app: 'externaldns-webhook',
                },
                name: 'cert-manager-externaldns-webhook',
            },
            spec: {
                replicas: 1,
                selector: {
                    matchLabels: {
                        app: 'externaldns-webhook',
                    },
                },
                template: {
                    metadata: {
                        labels: {
                            app: 'externaldns-webhook',
                        },
                    },
                    spec: {
                        serviceAccountName: 'externaldns-webhook',
                        volumes: [
                            {
                                name: 'certs',
                                secret: {
                                    secretName: 'externaldns-webhook-tls',
                                },
                            },
                        ],
                        containers: [
                            {
                                image: 'absaoss/cert-manager-webhook-externaldns:dev',
                                name: 'cert-manager-webhook-externaldns',
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

        // Create a selfsigned Issuer, in order to create a root CA certificate for
        // signing webhook serving certificates
        new Issuer(this, 'Issuer-webhook-selfsign', {
            metadata: {
                name: 'externaldns-webhook-selfsign',
                labels: {
                    app: 'externaldns-webhook',
                },
            },
            spec: {
                selfSigned: {},
            },
        });

        // Create an Issuer that uses the above generated CA certificate to issue certs
        new Issuer(this, 'Issuer-webhook-ca', {
            metadata: {
                name: 'externaldns-webhook-ca',
                labels: {
                    app: 'externaldns-webhook',
                },
            },
            spec: {
                ca: {
                    secretName: 'externaldns-webhook-ca',
                },
            },
        });

        new KubeServiceAccount(this, 'ServiceAccount', {
            metadata: {
                name: 'externaldns-webhook',
                labels: {
                    app: 'externaldns-webhook',
                },
            },
        });

        // Grant the webhook permission to read the ConfigMap containing the Kubernetes
        // apiserver's requestheader-ca-certificate.
        // This ConfigMap is automatically created by the Kubernetes apiserver.
        new KubeRoleBinding(this, 'KubeRoleBinding', {
            metadata: {
                name: 'externaldns-webhook:webhook-authentication-reader',
                namespace: 'kube-system',
                labels: {
                    app: 'externaldns-webhook',
                },
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
                    name: 'externaldns-webhook',
                    namespace: this.namespace!,
                },
            ],
        });

        // apiserver gets the auth-delegator role to delegate auth decisions to
        // the core apiserver
        new KubeClusterRoleBinding(this, 'ClusterRoleBinding', {
            metadata: {
                name: 'externaldns-webhook:auth-delegator',
                labels: {
                    app: 'externaldns-webhook',
                },
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
                    name: 'externaldns-webhook',
                    namespace: this.namespace!,
                },
            ],
        });

        new KubeClusterRole(this, 'KubeClusterRole', {
            metadata: {
                name: 'externaldns-webhook-role',
                labels: {
                    app: 'externaldns-webhook',
                },
            },
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

        new KubeClusterRoleBinding(this, 'KubeClusterRoleBinding', {
            metadata: {
                name: 'externaldns-webhook:flowcontrol',
                labels: {
                    app: 'externaldns-webhook',
                },
            },
            roleRef: {
                apiGroup: 'rbac.authorization.k8s.io',
                kind: 'ClusterRole',
                name: 'externaldns-webhook-role',
            },
            subjects: [
                {
                    apiGroup: '',
                    kind: 'ServiceAccount',
                    name: 'externaldns-webhook',
                    namespace: this.namespace!,
                },
            ],
        });

        // Serving certificate for the webhook to use
        new Certificate(this, 'Certificate-webhook', {
            metadata: {
                name: 'externaldns-webhook-tls',
                labels: {
                    app: 'externaldns-webhook',
                },
            },
            spec: {
                secretName: 'externaldns-webhook-tls',
                duration: '8760h', // 1y
                issuerRef: {
                    name: 'externaldns-webhook-ca',
                },
                dnsNames: [
                    'externaldns-webhook',
                    'externaldns-webhook.cert-manager',
                    'externaldns-webhook.cert-manager.svc',
                    'externaldns-webhook.cert-manager.svc.cluster.local',
                ],
            },
        });

        new KubeService(this, 'Service', {
            metadata: {
                name: 'externaldns-webhook',
                labels: {
                    app: 'externaldns-webhook',
                },
            },
            spec: {
                type: 'ClusterIP',
                ports: [
                    {
                        port: 443,
                        protocol: Protocol.TCP,
                        name: 'https',
                    },
                ],
                selector: {
                    app: 'externaldns-webhook',
                },
            },
        });
    }
}

export const parseInputs = (
    props: Partial<CertManagerWebhookExternalDnsProps>
): CertManagerWebhookExternalDnsProps => {
    return {
        domain: props.domain ?? 'example.com',
    };
};
