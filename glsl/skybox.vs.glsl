varying vec3 Normal_V;
varying vec3 V_position;

void main() {

	Normal_V = normalMatrix*normal;
	V_position = position;

	mat4 V = mat4(
		viewMatrix[0],
		viewMatrix[1],
		viewMatrix[2],
		0.0, 0.0, 0.0, 1.0
	);

	gl_Position = projectionMatrix * V * modelMatrix* vec4(position, 1.0);
}