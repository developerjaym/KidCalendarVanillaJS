const environment = fetch('../../environments/environment.json')
	.then(response => response.json());

export default await environment;