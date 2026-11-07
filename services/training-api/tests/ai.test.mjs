import test from "node:test";
import assert from "node:assert/strict";
import {
 validateTutorRequest,validateVoiceRequest,tutorInstructions,
 aiFlags,askTutor,synthesizeTutorSpeech,AI_LIMITS
} from "../src/ai-tutor.mjs";
const env={
 OPENAI_API_KEY:"sk-test-not-a-real-api-key-only-for-tests",
 AGSA_AI_ENABLED:"1",AGSA_AI_VOICE_ENABLED:"1",
 AGSA_AI_TEXT_MODEL:"gpt-6-luna"
};
test("AI is disabled without explicit operator keys and flags",async()=>{
 assert.deepEqual(aiFlags({}),{enabled:false,voiceEnabled:false});
 assert.deepEqual(aiFlags({OPENAI_API_KEY:env.OPENAI_API_KEY}),{enabled:false,voiceEnabled:false});
 assert.deepEqual(aiFlags({...env,AGSA_AI_VOICE_ENABLED:"0"}),{enabled:true,voiceEnabled:false});
 await assert.rejects(askTutor({question:"What is lift?"},{env:{}}),e=>e.status===503);
 await assert.rejects(synthesizeTutorSpeech({text:"An aviation lesson"},{env:{}}),e=>e.status===503);
});
test("strict question and TTS validation and no browser model selection",()=>{
 assert.deepEqual(validateTutorRequest({question:"  What is lift?  ",style:"mentor",topic:"forces"}),
  {question:"What is lift?",style:"mentor",topic:"forces"});
 assert.equal(validateVoiceRequest({text:" Hello ground school ",voice:"coral"}).text,"Hello ground school");
 assert.throws(()=>validateTutorRequest({question:"x"}),/3–500/);
 assert.throws(()=>validateTutorRequest({question:"a".repeat(501)}),/3–500/);
 assert.throws(()=>validateTutorRequest({question:"What is lift?",topic:"malicious"}),/supported/);
 assert.throws(()=>validateTutorRequest({question:"What is lift?",style:"system"}),/supported/);
 assert.throws(()=>validateVoiceRequest({text:"Hi"}),/4–700/);
 assert.throws(()=>validateVoiceRequest({text:"a".repeat(701)}),/4–700/);
 assert.throws(()=>validateVoiceRequest({text:"Speech sample",voice:"custom_voice_id"}),/Unsupported/);
 assert.match(tutorInstructions({topic:"weather",style:"exam"}),/weather/);
 assert.match(tutorInstructions({topic:"weather",style:"scouts"}),/Air Scouts/);
 assert.match(tutorInstructions({topic:"forces",style:"mentor"}),/NON-ACCREDITED/);
 assert.equal(AI_LIMITS.text,12);assert.equal(AI_LIMITS.voice,5);
});
test("real provider path uses explicit server credentials, no storage and limited output",async()=>{
 let requests=0;
 const out=await askTutor({question:"What is drag?",topic:"forces",style:"mentor",model:"anything",apiKey:"hacked"},{
  env,request:async(url,options)=>{
   requests++;
   assert.equal(url,"https://api.openai.com/v1/responses");
   assert.equal(options.method,"POST");
   assert.equal(options.headers.Authorization,"Bearer "+env.OPENAI_API_KEY);
   const body=JSON.parse(options.body);
   assert.equal(body.model,"gpt-6-luna");
   assert.equal(body.store,false);
   assert.equal(body.max_output_tokens,440);
   assert.equal(body.input[0].content,"What is drag?");
   assert.ok(!JSON.stringify(body).includes("hacked"));
   return {ok:true,json:async()=>({output:[{type:"message",content:[{type:"output_text",text:"Drag opposes motion through the air."}]}]})};
  }
 });
 assert.equal(requests,1);
 assert.equal(out.mode,"GENERATIVE_AI");
 assert.match(out.answer,/opposes motion/);
 assert.match(out.notice,/approved/);
 await assert.rejects(askTutor({question:"What is lift?"},{env,request:async()=>({ok:false})}),e=>e.status===502);
 await assert.rejects(askTutor({question:"What is lift?"},{env,request:async()=>{throw Error(env.OPENAI_API_KEY)}}),
  e=>e.status===502&&!e.message.includes(env.OPENAI_API_KEY));
});
test("natural generated voice streams only bounded MP3 bytes via fixed provider endpoint",async()=>{
 const bytes=Buffer.alloc(64,63);
 const output=await synthesizeTutorSpeech({text:"What does airspeed mean?",voice:"coral"},{env,
  request:async(url,options)=>{
   assert.equal(url,"https://api.openai.com/v1/audio/speech");
   const body=JSON.parse(options.body);
   assert.equal(body.model,"gpt-4o-mini-tts");
   assert.equal(body.voice,"coral");
   assert.equal(body.response_format,"mp3");
   assert.ok(!JSON.stringify(body).includes("apiKey"));
   return new Response(bytes,{status:200,headers:{"Content-Type":"audio/mpeg"}});
  }
 });
 assert.deepEqual(output,bytes);
 await assert.rejects(synthesizeTutorSpeech({text:"Read this lesson"},{env,
  request:async()=>new Response(Buffer.alloc(1000000,65),{status:200})
 }),e=>e.status===502);
 await assert.rejects(synthesizeTutorSpeech({text:"Read this lesson"},{env,
  request:async()=>{throw Error(env.OPENAI_API_KEY)}
 }),e=>e.status===502&&!e.message.includes(env.OPENAI_API_KEY));
});
