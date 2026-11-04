const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
const hp1=document.querySelector('#hp1'),hp2=document.querySelector('#hp2'),overlay=document.querySelector('#message');
const keys=new Set();let game={},tapMask=0,frame=0,shake=0,ended=0;
const keyBits={a:1,ArrowLeft:1,arrowleft:1,d:2,ArrowRight:2,arrowright:2,w:4,ArrowUp:4,arrowup:4,j:8,' ':8,k:16,l:32,u:64,o:128,s:256,ArrowDown:256,arrowdown:256};
const names=['','PUMN','CROȘEU','COMBO!','LOVITURĂ','MĂTURARE','ATAC AERIAN','TĂIETURĂ'];
function initGame(){
 const funcs=['game_reset','game_step','game_player_x','game_player_y','game_player_hp','game_rival_x','game_rival_y','game_rival_hp','game_player_move','game_rival_move','game_player_progress','game_rival_progress','game_player_guard','game_rival_guard','game_player_crouch','game_rival_crouch','game_player_flash','game_rival_flash','game_player_label','game_rival_label','game_over'];
 for(const name of funcs)game[name]=Module.cwrap(name,'number',name==='game_step'?['number']:[]);
 game.game_reset();requestAnimationFrame(loop);
}
window.initGame=initGame;
window.addEventListener('keydown',e=>{const bit=keyBits[e.key]??keyBits[e.key.toLowerCase()];if(bit){e.preventDefault();keys.add(e.key.toLowerCase())}},{capture:true});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()),{capture:true});window.addEventListener('blur',()=>keys.clear());
document.querySelectorAll('[data-bit]').forEach(button=>button.addEventListener('pointerdown',e=>{e.preventDefault();canvas.focus({preventScroll:true});tapMask|=Number(button.dataset.bit)}));
document.querySelectorAll('[data-guard]').forEach(button=>{button.addEventListener('pointerdown',e=>{e.preventDefault();canvas.focus({preventScroll:true});keys.add('o')});for(const type of ['pointerup','pointercancel','pointerleave'])button.addEventListener(type,()=>keys.delete('o'))});
document.querySelector('#restart').onclick=()=>{game.game_reset();ended=0;overlay.classList.add('hidden')};
function inputMask(){let result=tapMask;tapMask=0;for(const key of keys)result|=keyBits[key]||0;return result}
function background(){
 const gradient=ctx.createLinearGradient(0,0,0,540);gradient.addColorStop(0,'#131827');gradient.addColorStop(.62,'#222332');gradient.addColorStop(1,'#100e17');ctx.fillStyle=gradient;ctx.fillRect(0,0,960,540);
 ctx.fillStyle='#d7c49b';ctx.globalAlpha=.13;ctx.beginPath();ctx.arc(757,135,62,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
 ctx.fillStyle='#111622';ctx.beginPath();ctx.moveTo(0,340);for(let x=0;x<=960;x+=80)ctx.lineTo(x,290+Math.sin(x*.025)*35);ctx.lineTo(960,430);ctx.lineTo(0,430);ctx.fill();
 ctx.fillStyle='#1a1821';ctx.fillRect(0,434,960,110);ctx.strokeStyle='#52413a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,434);ctx.lineTo(960,434);ctx.stroke();
 for(let x=30;x<960;x+=95){ctx.strokeStyle='#292630';ctx.beginPath();ctx.moveTo(x,438);ctx.lineTo(x-34,540);ctx.stroke()}
 ctx.strokeStyle='#3e3031';ctx.lineWidth=8;ctx.strokeRect(390,205,180,210);ctx.lineWidth=3;ctx.strokeRect(408,224,144,190);
 for(const x of [90,870]){ctx.fillStyle='#4b3430';ctx.fillRect(x-3,300,6,130);ctx.fillStyle='#efa95c';ctx.globalAlpha=.7+Math.sin(frame*.08+x)*.2;ctx.beginPath();ctx.arc(x,292,8,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}
}
function drawF(x,y,id,progress,guard,crouch,flash,label,player){
 const color=player?'#e4ded3':'#161923',kind=id===4?'kick':id===5?'sweep':id===6?'air':id===7?'sword':'punch';
 if(flash%2)ctx.globalAlpha=.45;ctx.save();ctx.translate(x,y);ctx.fillStyle='#090a10';ctx.beginPath();ctx.ellipse(0,2,31,7,0,0,Math.PI*2);ctx.fill();ctx.scale(player?1:-1,1);
 const low=crouch||kind==='sweep',bodyTop=low?-48:-65,headY=low?-63:-79;
 const swing=Math.sin(Math.max(0,Math.min(1,progress))*Math.PI),extension=56*swing;
 ctx.lineCap='round';ctx.strokeStyle=color;ctx.lineWidth=11;ctx.beginPath();
 if(kind==='sweep'){ctx.moveTo(-5,-25);ctx.lineTo(-14,-9);ctx.lineTo(-23,-2);ctx.moveTo(5,-25);ctx.lineTo(24,-13);ctx.lineTo(38+extension,-8)}
 else if(kind==='kick'||kind==='air'){ctx.moveTo(-5,-25);ctx.lineTo(-12,-4);ctx.lineTo(-21,-1);ctx.moveTo(5,-25);ctx.lineTo(18+extension,-30-swing*15);ctx.lineTo(30+extension,-32-swing*15)}
 else{ctx.moveTo(-5,-25);ctx.lineTo(-12,-4);ctx.lineTo(-20,-1);ctx.moveTo(5,-25);ctx.lineTo(12,-4);ctx.lineTo(20,-1)}ctx.stroke();
 ctx.lineWidth=15;ctx.beginPath();ctx.moveTo(0,bodyTop);ctx.lineTo(0,low?-27:-30);ctx.stroke();ctx.fillStyle=color;ctx.beginPath();ctx.arc(0,headY,12,0,Math.PI*2);ctx.fill();ctx.fillRect(-11,headY-14,25,4);ctx.fillStyle='#11131b';ctx.fillRect(5,headY-3,7,2);
 ctx.strokeStyle=color;ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(0,bodyTop+8);
 if(guard){ctx.lineTo(17,-68);ctx.lineTo(7,-88);ctx.moveTo(0,bodyTop+8);ctx.lineTo(24,-52);ctx.lineTo(13,-72)}
 else if(kind==='punch'){ctx.lineTo(15,-48);ctx.lineTo(24+extension,-52)}else if(kind==='sword'){ctx.lineTo(14,-48);ctx.lineTo(30+swing*12,-55+swing*15)}else{ctx.lineTo(12,-48);ctx.lineTo(27,-46)}ctx.stroke();
 if(!guard&&kind==='sword'){ctx.strokeStyle='#d7efff';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(25+swing*12,-55+swing*15);ctx.lineTo(78+swing*20,-77+swing*22);ctx.stroke();ctx.strokeStyle='#73c7ee99';ctx.lineWidth=3;ctx.beginPath();ctx.arc(4,-52,65,-1.05+swing*.5,.2+swing*.7);ctx.stroke()}
 if(!guard&&(kind==='kick'||kind==='air'||kind==='sweep')){ctx.strokeStyle='#f5c46c99';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(22,-34);ctx.lineTo(48+extension,-39);ctx.stroke()}
 if(guard){ctx.strokeStyle='#80c8ff';ctx.lineWidth=2;ctx.strokeRect(13,-94,20,49)}
 if(label>0&&!guard&&id>0){ctx.scale(player?1:-1,1);ctx.fillStyle='#f0c678';ctx.font='700 15px Rajdhani';ctx.textAlign='center';ctx.fillText(names[id],0,headY-24)}ctx.restore();ctx.globalAlpha=1;
}
function loop(){
 if(!game.game_step)return;frame++;ended=game.game_step(inputMask());hp1.style.width=game.game_player_hp()+'%';hp2.style.width=game.game_rival_hp()+'%';
 ctx.save();if(shake){ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);shake*=.8}background();
 drawF(game.game_player_x(),game.game_player_y(),game.game_player_move(),game.game_player_progress(),game.game_player_guard(),game.game_player_crouch(),game.game_player_flash(),game.game_player_label(),true);
 drawF(game.game_rival_x(),game.game_rival_y(),game.game_rival_move(),game.game_rival_progress(),game.game_rival_guard(),game.game_rival_crouch(),game.game_rival_flash(),game.game_rival_label(),false);ctx.restore();
 if(ended&&!overlay.classList.contains('hidden')){document.querySelector('#result').textContent=ended>0?'VICTORIE':'ÎNFRÂNGERE';document.querySelector('#sub').textContent=ended>0?'Ai câștigat duelul.':'Kage a câștigat runda.';overlay.classList.remove('hidden')}
 requestAnimationFrame(loop);
}

