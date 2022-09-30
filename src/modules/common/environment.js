const environment = fetch(window.location.href + '/environments/environment.json')
	.then(response => response.json());

export default await environment;