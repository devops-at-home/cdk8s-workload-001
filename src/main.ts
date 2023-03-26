import { App } from 'cdk8s';
import { AwsEncryptionProvider } from './charts/aws-encryption-provider.chart';
import { HelloKubernetes } from './charts/hello-kubernetes.chart';

const app = new App();

new HelloKubernetes(app, 'HelloKubernetes');

new AwsEncryptionProvider(app, 'AwsEncryptionProvider', {
    account: process.env.ACCOUNT_ID,
    key: process.env.KEY_ID,
});

app.synth();
