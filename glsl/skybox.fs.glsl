// UNIFORMS
uniform samplerCube skybox;

varying vec3 Normal_V;
varying vec3 V_position;

void main() {
	//vec3 fTexCoord = vec4(Normal_V,1.0)).xyz;

	vec3 n = normalize(Normal_V);
	vec3 v = -1.0*normalize(V_position);

	vec3 ref = reflect(v,n);
	vec3 sample = textureCube(skybox, V_position).rgb;
	gl_FragColor = vec4(sample, 1.0);
}