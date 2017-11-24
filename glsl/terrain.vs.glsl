//VARYING VAR
varying vec3 Normal_V;
varying vec3 Position_V;
varying vec4 PositionFromLight_V;
varying vec2 Texcoord_V;
varying vec4 clipCord;

//UNIFORM VAR
// Inverse world matrix used to render the scene from the light POV
uniform mat4 lightViewMatrixUniform;
// Projection matrix used to render the scene from the light POV
uniform mat4 lightProjectMatrixUniform;

void main() {
	Normal_V = normalMatrix * normal;
	Position_V = vec3(modelViewMatrix * vec4(position, 1.0));
	PositionFromLight_V = lightViewMatrixUniform *modelMatrix* vec4(position, 1.0);
	Texcoord_V = uv;
	clipCord = lightProjectMatrixUniform*PositionFromLight_V;
	clipCord = clipCord / clipCord.w;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}