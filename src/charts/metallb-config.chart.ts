import { Chart, ChartProps } from 'cdk8s';
import { Construct } from 'constructs';
import { IpAddressPool, L2Advertisement } from '../imports/metallb.io';

interface MetalLbConfigProps extends ChartProps {
    addresses: string[];
}

export class MetalLbConfig extends Chart {
    constructor(scope: Construct, id: string, props: MetalLbConfigProps) {
        super(scope, id, props);

        const { addresses } = props;

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
