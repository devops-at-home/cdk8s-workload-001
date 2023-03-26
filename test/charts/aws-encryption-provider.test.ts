import { App } from 'cdk8s';
import {
    AwsEncryptionProvider,
    parseInputs,
    AwsEncryptionProviderProps,
} from '../../src/charts/aws-encryption-provider.chart';

describe('Snapshot tests', () => {
    test('Hello Kubernetes', () => {
        const app = new App();

        const chart = new AwsEncryptionProvider(app, 'AwsEncryptionProvider');

        expect(chart).toMatchSnapshot();
    });

    test('parseInputs function default values', () => {
        const response = parseInputs({});
        expect(response.containerPort).toStrictEqual(8080);
        expect(response.image).toStrictEqual(
            '012345678901.dkr.ecr.ap-southeast-2.amazonaws.com/aws-encryption-provider:latest'
        );
        expect(response.name).toStrictEqual('aws-encryption-provider');
        expect(response.region).toStrictEqual('ap-southeast-2');
        expect(response.key).toStrictEqual(
            'arn:aws:kms:ap-southeast-2:012345678901:key/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
        );
    });

    test('parseInputs function with inputs', () => {
        const inputs: AwsEncryptionProviderProps = {
            containerPort: 8081,
            image: 'some-image',
            name: 'some-name',
            account: '123456789012',
            key: 'xx',
            ecr: false,
            region: 'some-region',
        };

        const response = parseInputs(inputs);
        expect(response.containerPort).toStrictEqual(inputs.containerPort);
        expect(response.image).toStrictEqual(inputs.image);
        expect(response.name).toStrictEqual(inputs.name);
        expect(response.key).toStrictEqual(
            `arn:aws:kms:${inputs.region}:${inputs.account}:key/${inputs.key}`
        );
        expect(response.region).toStrictEqual(inputs.region);
    });
});
