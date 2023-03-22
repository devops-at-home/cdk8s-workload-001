import { cdk8s } from 'projen';

const project = new cdk8s.Cdk8sTypeScriptApp({
    authorName: 'DevOps@Home',
    authorUrl: 'https://devops-at-ho.me',
    cdk8sVersion: '2.3.33',
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
    gitignore: ['.idea'],
    projenrcTs: true,
    licensed: false,

    // deps: [],                /* Runtime dependencies of this module. */
    // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
    // devDeps: [],             /* Build dependencies for this module. */
    // packageName: undefined,  /* The "name" in package.json. */
});

project.synth();
