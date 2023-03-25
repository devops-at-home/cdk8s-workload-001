import { cdk8s } from 'projen';

const project = new cdk8s.Cdk8sTypeScriptApp({
    authorName: 'DevOps@Home',
    authorUrl: 'https://devops-at-ho.me',
    cdk8sVersion: '2.7.41',
    defaultReleaseBranch: 'main',
    eslint: false,
    name: 'cdk8s-workload-001',
    prettier: true,
    prettierOptions: {
        settings: {
            printWidth: 100,
            tabWidth: 4,
            singleQuote: true,
        },
    },
    githubOptions: {
        pullRequestLint: false,
    },
    gitignore: ['.idea', 'crds.json'],
    projenrcTs: true,
    licensed: false,
    k8sSpecVersion: '1.25.0',
    jestOptions: {
        jestConfig: {
            coveragePathIgnorePatterns: ['/lib/imports/', '/src/imports/'],
        },
    },
    scripts: {
        'refresh-imports:k8s': 'cdk8s import k8s@1.25.0 -o src/imports',
        'refresh-imports:crd': 'cdk8s import crds.json -o src/imports',
    },

    // cdk8sPlus: true,
    // cdk8sPlusVersion: '2.2.9',

    // deps: [],                /* Runtime dependencies of this module. */
    // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
    // devDeps: [],             /* Build dependencies for this module. */
    // packageName: undefined,  /* The "name" in package.json. */
});

project.jest!.addTestMatch('**/?(*.)@(spec|test).[tj]s?(x)');

project.synth();
