import { Chart, ChartProps } from 'cdk8s';
import { Construct } from 'constructs';
import { IpAddressPool, L2Advertisement } from '../imports/metallb.io';

export type MetalLbConfigParams = {
    addresses: string[];
};

interface MetalLbConfigProps extends ChartProps, Partial<MetalLbConfigParams> {}

export class MetalLbConfig extends Chart {
    constructor(scope: Construct, id: string, props: MetalLbConfigProps) {
        super(scope, id, props);

        const { addresses } = parseInputs(props);

        const ipAddressPool = new IpAddressPool(this, 'IpAddressPool', {
            spec: {
                addresses,
            },
        });

        new L2Advertisement(this, 'L2Advertisement', {
            spec: {
                interfaces: ['tailscale0'],
                ipAddressPools: [ipAddressPool.name],
            },
        });
    }
}

export const parseInputs = (params: Partial<MetalLbConfigParams>): MetalLbConfigParams => {
    return {
        addresses: params.addresses ?? ['127.0.0.1/8'],
    };
};
