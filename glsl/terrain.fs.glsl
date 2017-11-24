//VARYING VAR
varying vec3 Normal_V;
varying vec3 Position_V;
varying vec4 PositionFromLight_V;
varying vec2 Texcoord_V;
varying vec4 clipCord;

//UNIFORM VAR
uniform vec3 lightColorUniform;
uniform vec3 ambientColorUniform;
uniform vec3 lightDirectionUniform;

uniform float kAmbientUniform;
uniform float kDiffuseUniform;
uniform float kSpecularUniform;

uniform float shininessUniform;

uniform sampler2D colorMap;
uniform sampler2D normalMap;
uniform sampler2D aoMap;
uniform sampler2D shadowMap;

//UNIFORM VAR
// Inverse world matrix used to render the scene from the light POV
uniform mat4 lightViewMatrixUniform;
// Projection matrix used to render the scene from the light POV
uniform mat4 lightProjectMatrixUniform;

// PART D)
// Use this instead of directly sampling the shadowmap, as the float
// value is packed into 4 bytes as WebGL 1.0 (OpenGL ES 2.0) doesn't
// support floating point bufffers for the packing see depth.fs.glsl
float getShadowMapDepth(vec2 texCoord)
{
	vec4 v = texture2D(shadowMap, texCoord);
	const vec4 bitShift = vec4(1.0, 1.0/256.0, 1.0/(256.0 * 256.0), 1.0/(256.0*256.0*256.0));
	return dot(v, bitShift);
}

void main() {
	// PART B) TANGENT SPACE NORMAL
	vec3 N_1 = normalize(texture2D(normalMap, Texcoord_V).xyz * 2.0 - 1.0);

	// PRE-CALCS
	vec3 N = normalize(Normal_V);
	vec3 up = N;
	vec3 T = normalize(vec3(viewMatrix*vec4(0.0, 0.0, 1.0, 0.0)));
	vec3 B = cross(up,T);

	mat4 tangentTransform = mat4(
		T.x, B.x, N.x, 0.0,
		T.y, B.y, N.y, 0.0,
		T.z, B.z, N.z, 0.0,
		0.0, 0.0, 0.0, 0.0
	);

	N = N_1;
	vec3 L = normalize(vec3(tangentTransform * vec4(lightDirectionUniform, 0.0)));
	vec3 V = normalize(vec3(tangentTransform * vec4(-Position_V, 0.0)));
	vec3 H = normalize(V + L);

	// AMBIENT
	vec3 light_AMB = kAmbientUniform * vec3(texture2D(aoMap, Texcoord_V));

	// DIFFUSE
	vec3 diffuse = kDiffuseUniform *vec3(texture2D(colorMap, Texcoord_V));;
	vec3 light_DFF = diffuse * max(0.0, dot(N, L));

	// SPECULAR
	vec3 specular = kSpecularUniform * lightColorUniform;
	vec3 light_SPC = specular * pow(max(0.0, dot(H, N)), shininessUniform);

	// TOTAL
	vec3 TOTAL = light_AMB + light_DFF  + light_SPC;

	// SHADOW
	// Fill in attenuation for shadow here

	

	float dx = 0.0002;
	float dy = 0.0002;
	float count = 0.0;

	float shadowDepth = getShadowMapDepth(vec2(0.5,0.5)+0.5*clipCord.xy);
	if(shadowDepth< (0.5+0.5*clipCord.z)){
		count = count + 1.0;
	}

	for( int index =0; index < 10; index++){
		shadowDepth = getShadowMapDepth(vec2(0.5+dx,0.5+dy)+0.5*clipCord.xy);
		if(shadowDepth< (0.5+0.5*clipCord.z)){
			count = count + 1.0;
		}

		shadowDepth = getShadowMapDepth(vec2(0.5-dx,0.5+dy)+0.5*clipCord.xy);
		if(shadowDepth< (0.5+0.5*clipCord.z)){
			count = count + 1.0;
		}

		shadowDepth = getShadowMapDepth(vec2(0.5+dx,0.5-dy)+0.5*clipCord.xy);
		if(shadowDepth< (0.5+0.5*clipCord.z)){
			count = count + 1.0;
		}

		shadowDepth = getShadowMapDepth(vec2(0.5-dx,0.5-dy)+0.5*clipCord.xy);
		if(shadowDepth< (0.5+0.5*clipCord.z)){
			count = count + 1.0;
		}

		dx = dx+0.0002;
		dy = dy+0.0002;
	}


	TOTAL = TOTAL*(1.0-count/41.0*0.7);
	

	
	gl_FragColor =  vec4(TOTAL, 1.0);
}
