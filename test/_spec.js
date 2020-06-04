let log = require('fancy-log'); // eslint-disable-line no-unused-vars

// let should = require('should');
let assert = require('assert');
let helper = require('node-red-node-test-helper');
const handlebarsjsNode = require('../nodes/handlebarsjs/handlebarsjs');

helper.init(require.resolve('node-red'));

/**
 * Ensure that the module loads.
 */
describe('simple-test', () => {
  afterEach(() => {
    helper.unload();
  });

  it('should load', (done) => {
    const flow = [{id:'n1', type:'handlebarsjs', name:'handlebarsjs'}];
    helper.load(handlebarsjsNode, flow, () => {
      let n1 = helper.getNode('n1');
      n1.should.have.property('name', 'handlebarsjs');
      assert.equal(n1.name, 'handlebarsjs', 'The default name should be handlebars');
      done();
    });
  });

  /**
   * Ensure that dot notation works when accessing source / target properties
   * like getting the payload.person and setting payload.response
   */
  it('should set values using dot notation', () => {
    const testPromise = new Promise((resolve,reject) => {
      const flow = [
        {id:"n1", type: "handlebarsjs", name:"test-node", wires:[["n2"]], query:"Hello {{name}}! Happy {{age}} birthday!",
          sourceProperty:"payload.person", targetProperty: "payload.response"
        },
        {id:"n2", type:"helper"}
      ];
      helper.load(handlebarsjsNode, flow, () => {

        //-- determine the nodes
        const n1 = helper.getNode("n1");
        const n2 = helper.getNode("n2");

        n2.on("input", (msg) => {
          try {
            assert.equal(msg.payload.response, "Hello John Doe! Happy 31 birthday!");
            resolve();
          } catch(err){
            reject(err);
          }
        });

        //-- now the wire is setup, lets feed it some info
        n1.receive({
          "payload": {
            "person": {
              "name": "John Doe",
              "age": "31"
            }
          }
        });
      });
    });
    return testPromise;
  });

  /**
   * Ensure that dot notation works when directly accessing and setting the payload
   */
  it('should work directly on the payload', (done) => {
    const flow = [
      {id:"n1", type: "handlebarsjs", name:"test-node", wires:[["n2"]], query:"Hello {{person.name}}! Happy {{person.age}} birthday!",
        sourceProperty:"payload", targetProperty: "payload"
      },
      {id:"n2", type:"helper"}
    ];
    helper.load(handlebarsjsNode, flow, () => {
      //-- determine the nodes
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");

      n2.on("input", (msg) => {
        assert.equal(msg.payload, "Hello John Doe! Happy 31 birthday!");
        done();
      });

      //-- now the wire is setup, lets feed it some info
      n1.receive({
        "payload": {
          "person": {
            "name": "John Doe",
            "age": "31"
          }
        }
      });
    });
  });
});