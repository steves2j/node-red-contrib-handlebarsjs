# Overview

Extending the original handlebars Node-Red module that allows you to apply handlebars to a given message (msg) property and place the results in a separate property.

Based of the original https://flows.nodered.org/node/node-red-contrib-handlebars which doesn't have a git repo anymore, and has no more support for it.

**FLOW JSON**

	[{"id":"128d44a7.7905cb","type":"tab","label":"Flow 1","disabled":false,"info":""},{"id":"b055b07a.9c183","type":"handlebars","z":"128d44a7.7905cb","name":"","sourceProperty":"payload.person","targetProperty":"payload.response","query":"Hello {{name}}! Happy {{age}} birthday!","x":430,"y":180,"wires":[["96b8f886.005828"]]},{"id":"96b8f886.005828","type":"debug","z":"128d44a7.7905cb","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","x":670,"y":180,"wires":[]},{"id":"2eb6a16e.fc7d7e","type":"inject","z":"128d44a7.7905cb","name":"Inject Payload","topic":"","payload":"{\"person\":{\"name\":\"John Doe\",\"age\":\"31\"}}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":150,"y":180,"wires":[["b055b07a.9c183"]]}]

For example, with the following configuration:

<table>
	<tr>
		<th>Name</th>
		<th>Description</th>
		<th>Default Value</th>
	</tr>
	<tr>
		<td>Name</td>
		<td>The label shown on the node within the editor</td>
		<td>Handlebars</td>
	</tr>
	<tr>
		<td>Source Property</td>
		<td>The property on the msg object to provide to handlebars.</td>
		<td>payload.person</td>
	</tr>
	<tr>
		<td>Target Property</td>
		<td>The property on the msg object to apply the results.</td>
		<td>payload.response</td>
	</tr>
	<tr>
		<td>Template</td>
		<td>The handlebars template to apply</td>
		<td>Hello {{name}}! Happy {{age}} birthday!</td>
	</tr>
    <tr>
		<td>Template Folder</td>
		<td>The folder to fetch a template from</td>
		<td>.templates</td>
	</tr>
    <tr>
		<td>Template Name</td>
		<td>The template to load from disk or cache to apply</td>
		<td>{msg.templatename}</td>
	</tr>
    <tr>
		<td>No Cache</td>
		<td>Do not cache the loaded templates. This will be a performace hit on the system</td>
		<td>false</td>
	</tr>
    
</table>

The following msg object:

	{
		payload: {
			person: {
				"name": "John Doe",
				"age": "31"
			}
		}
	}

Provides the following:

	{
		payload: {
			response: "Hello John Doe! Happy 31 birthday!",
			person: {
				"name": "John Doe",
				"age": "31"
			}
		}
	}
    
If you supply a Template Folder then it will use the supplied Template Name to load the template from that folder. If no name is provided then the msg.templatename will be used.
Any loaded template will then be cached and used from the cache.
If no template is found then a new property with an error will be added to the msg.
For debugging templates without reloading Node Red, you can check the No Cache checkbox. But this will be a performace impact on the system, as each template has to be re compiled every time.

## Running Tests
* To test the project run `npm run test` or `npm run test:watch` to continuously test.

## Running Linter
* To run linters on the project, run `npm run lint` or `npm run lint:watch` to continously lint.

