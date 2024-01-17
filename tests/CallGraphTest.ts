import { CallGraph } from "../src/callgraph/CallGraph";


export class CallGraphTest {
    private loadCallGraph(): CallGraph {
        let filenames = ['./tests/resources/callgraph/main.ts', './tests/resources/callgraph/a.ts', './tests/resources/callgraph/b.ts',];

        let callgraph = new CallGraph(new Set<string>, new Map<string, string[]>);
        callgraph.processFiles(filenames);
        return callgraph;
    }

    public testCallGraph() {
        let callgraph = this.loadCallGraph();
        callgraph.printCallGraph();
    }
}



let callGraphTest = new CallGraphTest();
callGraphTest.testCallGraph();