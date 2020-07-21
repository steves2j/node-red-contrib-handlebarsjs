let log = require('fancy-log'); // eslint-disable-line
let fs = require("fs");

const handlebars = require('handlebars');

/**
 * Node JS Node to run a handlebars template
 * using one property as the source
 * and another property as the result.
 */
class handlebarsjsNode {

  /** Constructor */
  constructor() {
    // super();

    //-- initialize component properties
  }
  
  /**
   * Initialize the node red node
   * @param {object} RED - Node Red framework
   * @param {object} config - configuration for module from the node red editor
   * @param {object} nodeRedNode - the node red instance
   */
  initialize(RED, config, nodeRedNode) {
    // super.initialize(RED, config, nodeRedNode);

    this.RED = RED;
    this.config = config;
    this.nodeRedNode = nodeRedNode;

    //-- capture information from the nodeRedNode
    this.name = nodeRedNode.name;
    this.sourceProperty = nodeRedNode.sourceProperty;
    this.targetProperty = nodeRedNode.targetProperty;
    this.templateLocation = nodeRedNode.templateLocation;
    this.templateName = nodeRedNode.tname;
    this.nocache = nodeRedNode.nocache;
    this.query = nodeRedNode.query;
    this.compiledQuery = null;
    this.cache={};

    log("Inited");

    let reviver = (key, value) => {  
  	if (typeof value === 'string' 
      		&& value.indexOf('function ') === 0) {    
    		let functionTemplate = `(${value})`;    
    		return eval(functionTemplate);  
  	}  
  	return value;
    }

    try {
    let hfDir=this.templateLocation+"/helperFunctions";
    fs.readdir(hfDir, function(err,files){
        files.forEach(file=>{
            let cmdName=file.substr(0,file.lastIndexOf("."));
            let templet=fs.readFileSync(hfDir+"/"+file,"utf8");
		log(templet);
	    let obj=JSON.parse(templet,reviver);
            handlebars.registerHelper(obj.name,obj.func);
        });
    });
    
    } catch (err){
        console.log(err);
        console.log("No helperFunctions dir or functions to load");
    }
	 // handlebars.registerHelper("fixed2",function(floatin){return floatin.toFixed(2);});
    log("Done loading helpers");

    if (this.query) {
        log("Query was specified");
        try {
          this.compiledQuery = handlebars.compile(this.query);
          nodeRedNode.status({fill:'green', shape:'circle',text:'success compiling handlebars'});
        } catch(err){
          const errMsg = 'error when compiling the query:' + JSON.stringify(err);
          nodeRedNode.error(errMsg);
          //-- @TODO: check whether the status is needed, or if we should just user the error.
          nodeRedNode.status({fill:'red', shape:'ring',text:'Error compiling handlebars query'});
        }
    }
    
    /**
     * handle inputs provided within the node red flow
     */
    nodeRedNode.on('input', (msg) => {
      let results;
      let source = {};
      
      log("input called");

      try {
        if (!this.sourceProperty){
          source = {msg:msg};
        } else {
          source = this.resolve(msg, this.sourceProperty);
        }
        if (this.compiledQuery) {
            log("compiled query");
            results = this.compiledQuery(source);
        } else {
            let tName=this.templateName;
            if (!this.templateName){
                tName=msg.templatename;
                log("Template Name :"+tName);
            }
            let cpQuery=this.cache[tName];
            log(cpQuery);
            if (!cpQuery || this.nocache==true) {
                log("notfound :"+this.templateLocation+"/"+tName);
                let templet=fs.readFileSync(this.templateLocation+"/"+tName,"utf8");
                if (!templet) {
                    nodeRedNode.error("Template File Not Found");
                    nodeRedNode.status({fill:'red', shape:'ring',text:'Template File not found'});
                    return;
                } else {
                    log("File found :");
                    log(templet);
                    cpQuery = handlebars.compile(templet);
                    if (this.nocache==false) this.cache[tName] = cpQuery;
                }
            }
            if (cpQuery) {
                results = cpQuery(source);
            }
        }
      } catch(err){
        let errMsg = 'Error has occurred compiling query:' + JSON.stringify(err);
        nodeRedNode.error(errMsg);
        nodeRedNode.status({fill:'red', shape:'ring',text:'Error compiling handlebars with value sent'});
        return;
      }

      try {
        this.assign(msg, this.targetProperty, results);
      } catch(err){
        nodeRedNode.error(`error occurred while setting the target property:${this.targetProperty}`);
        nodeRedNode.status({fill:'red', shape:'ring',text:`Error applying the target property:${this.targetProperty}`});
        return;
      }

      nodeRedNode.send(msg);
    });

    return this;
  }

  /**
   * Determines the value from a string path on an object.
   * For example, given an object:
   * `{ payload: { person: { name: 'john', age: 24 } } }`
   * 
   * A path of `payload.person.name` would give the value: 'john'
   * 
   * @param {object} obj - object that the path's variables should travers
   * @param {string} path - path of the field on an object to resolve - or a blank path provides the object
   * @returns {string} - the value of the path in the object
   */
  resolve(obj, path) {
    //-- Use RED.util.getMsgProperty(msg, path)
    //-- this allows intermediate objects to be created...
    //-- for more: https://nodered.org/docs/api/modules/v/0.20.0/@node-red_util_util.html#.getMessageProperty
    return this.RED.util.getMessageProperty(obj, path);
  }

  /**
   * Assigns a value at a given path within an object.
   * 
   * For example, given an object:
   * `{ payload: { person: { name: 'john', age: 24 } } }`
   * 
   * A path of `payload.person.name` with the value of 'jane' would give:
   * `{ payload: { person: { name: 'john', age: 24 } } }`
   * 
   * @param {object} obj - the object to navigate within.
   * @param {string} path - path from within the object (or null for the obj)
   * @param {any} val - the value to set at that path
   */
  assign(obj, path, val){
    //-- Use RED.util.evaluateNodeProperty(msg, path, val, true)
    //-- this allows intermediate objects to be created...
    //-- for more: https://nodered.org/docs/api/modules/v/0.20.0/@node-red_util_util.html#.setObjectProperty
    this.RED.util.setMessageProperty(obj, path, val, true);
  }
}

/**
 * Initialize node-red node module
 * @param {NodeRed} RED - Node Red framework instance
 */
function setupNodeRed(RED){
  RED.nodes.registerType('handlebarsjs', function(config){
    RED.nodes.createNode(this, config);

    //-- capture information from the config
    this.name = config.name;
    this.sourceProperty = config.sourceProperty;
    this.targetProperty = config.targetProperty;
    this.query = config.query;
    this.templateLocation = config.templateLocation;
    this.templateName = config.tname;
    this.nocache = config.nocache;
    
    log(config);
    
    

    this.info = new handlebarsjsNode()
      .initialize(RED, config, this);
  });
}

//-- because it seems we cannot export the class outright...
setupNodeRed.infoClass = handlebarsjsNode;

module.exports = setupNodeRed;
