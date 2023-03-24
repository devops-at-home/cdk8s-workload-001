import { Construct } from 'constructs';
import { App, Chart, ChartProps } from 'cdk8s';
import { Deployment } from 'cdk8s-plus-22';
import { EnvFieldPaths, EnvValue, ImagePullPolicy, Protocol } from 'cdk8s-plus-22/lib/container';
import { Probe } from 'cdk8s-plus-22/lib/probe';
import { ServiceAccount } from 'cdk8s-plus-22/lib/service-account';
import { Service, ServiceType } from 'cdk8s-plus-22/lib/service';

export class HelloKubernetes extends Chart {
    constructor(scope: Construct, id: string, props: ChartProps = {}) {
        super(scope, id, props);

        const name = 'hello-kubernetes';

        const labels = { 'app.kubernetes.io/name': name };

        const metadata = {
            name,
            labels,
        };

        const serviceAccount = new ServiceAccount(this, 'serviceAccount', {
            metadata,
        });

        const deployment = new Deployment(this, 'deployment', {
            metadata,
            replicas: 1,
            serviceAccount,
            containers: [
                {
                    name,
                    image: 'paulbouwer/hello-kubernetes:1.10.1',
                    imagePullPolicy: ImagePullPolicy.IF_NOT_PRESENT,
                    ports: [
                        {
                            name: 'http',
                            protocol: Protocol.TCP,
                            number: 8080,
                        },
                    ],
                    liveness: Probe.fromHttpGet('/'),
                    readiness: Probe.fromHttpGet('/'),
                    envVariables: {
                        PORT: EnvValue.fromValue('8080'),
                        MESSAGE: EnvValue.fromValue('Message goes here'),
                        KUBERNETES_NAMESPACE: EnvValue.fromFieldRef(EnvFieldPaths.POD_NAMESPACE),
                        KUBERNETES_POD_NAME: EnvValue.fromFieldRef(EnvFieldPaths.POD_NAME),
                        KUBERNETES_NODE_NAME: EnvValue.fromFieldRef(EnvFieldPaths.NODE_NAME),
                        CONTAINER_IMAGE: EnvValue.fromValue('paulbouwer/hello-kubernetes:1.10.1'),
                    },
                },
            ],
        });

        new Service(this, 'service', {
            metadata,
            type: ServiceType.LOAD_BALANCER,
            ports: [
                {
                    port: 8080,
                    name: 'http',
                },
            ],
            selector: deployment,
        });
    }
}

const app = new App();

new HelloKubernetes(app, 'HelloKubernetes');

app.synth();
