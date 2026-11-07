/* Aviation Ground School Academy — conceptual flight model V3.
   Educational response model only. Not for actual flight training or aircraft operation. */
(function(root) {
  "use strict";
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const approach = (value, target, rate, dt) => value + (target - value) * (1 - Math.exp(-rate * dt));
  const radians = degrees => degrees * Math.PI / 180;
  function makeState() {
    return {pitch:0, roll:0, heading:270, altitude:3500, speed:102,
      verticalSpeed:0, turnRate:0, slip:0, power:55, flaps:0,
      x:0, y:0, distance:0, elapsed:0};
  }
  function makeInput() {
    return {yokeX:0, yokeY:0, rudder:0, throttle:55, trim:0, flaps:0};
  }
  function step(state, input, delta) {
    const dt = clamp(Number(delta)||0,0,0.1);
    if(dt<=0) return state;
    const throttle=clamp(Number(input.throttle)||0,0,100);
    const flaps=clamp(Number(input.flaps)||0,0,30);
    const x=clamp(Number(input.yokeX)||0,-1,1);
    const y=clamp(Number(input.yokeY)||0,-1,1);
    const rudder=clamp(Number(input.rudder)||0,-1,1);
    const trim=clamp(Number(input.trim)||0,-1,1);
    const targetPitch=clamp(-y*16 + trim*5, -25,25);
    const targetRoll=clamp(x*40, -45,45);
    state.pitch=approach(state.pitch,targetPitch,1.8,dt);
    state.roll=approach(state.roll,targetRoll,1.9,dt);
    state.power=approach(state.power,throttle,3.2,dt);
    state.flaps=approach(state.flaps,flaps,2.4,dt);
    const targetSpeed=clamp(65+(state.power-20)*0.85-state.pitch*1.35-state.flaps*.5,40,165);
    state.speed=clamp(approach(state.speed,targetSpeed,.36,dt),40,180);
    const targetVS=clamp(state.pitch*115 + (state.power-55)*9 - Math.max(0,75-state.speed)*32, -2800,2800);
    state.verticalSpeed=approach(state.verticalSpeed,targetVS,.7,dt);
    state.altitude=clamp(state.altitude + state.verticalSpeed*dt/60, 0,18000);
    const coordinatedTurn=9.81*Math.tan(radians(state.roll)) / Math.max(25,state.speed*.514444) * 180 / Math.PI;
    state.turnRate=clamp(coordinatedTurn+rudder*1.35,-6,6);
    state.heading=(state.heading + state.turnRate*dt + 3600)%360;
    state.slip=approach(state.slip,rudder*.95-.05*state.roll/45,2,dt);
    const nmPerSecond=state.speed/3600;
    const headingRad=radians(state.heading);
    state.x+=Math.sin(headingRad)*nmPerSecond*dt;
    state.y+=Math.cos(headingRad)*nmPerSecond*dt;
    state.distance+=nmPerSecond*dt;
    state.elapsed+=dt;
    return state;
  }
  const api={makeState,makeInput,step,clamp};
  if(typeof module!=="undefined" && module.exports)module.exports=api;
  if(root)root.CockpitV3Model=api;
})(typeof window!=="undefined"?window:null);
