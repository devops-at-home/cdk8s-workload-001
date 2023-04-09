import { App } from 'cdk8s';
import { appFactory } from '../src/main';

describe('Snapshot test for appFactory chart', () => {
    const app = new App();

    appFactory(app);

    const charts = app.charts.map((chart) => {
        return { name: chart.labels['chart'], manifest: chart };
    });

    test.each(charts)('$name', ({ manifest }) => {
        expect(manifest.toJson()).toMatchSnapshot();
    });
});
