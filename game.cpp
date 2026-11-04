#include <algorithm>
#include <cmath>
#include <cstdlib>

namespace {
constexpr double GROUND = 430.0;
constexpr int LEFT = 1, RIGHT = 2, JUMP = 4, PUNCH = 8;
constexpr int KICK = 16, SWEEP = 32, SWORD = 64, GUARD = 128, CROUCH = 256;

struct MoveDef { int damage, duration, active, recovery; double range; int kind; };
// kinds: punch, kick, sweep, air, sword
const MoveDef moves[] = {
    {0,0,0,0,0,0}, {8,22,13,8,108,0}, {12,27,16,10,120,0},
    {17,34,20,15,132,0}, {15,32,18,13,138,1}, {18,39,23,15,122,2},
    {17,33,17,14,148,3}, {23,42,25,17,160,4}
};
struct Fighter {
    double x, y, vx=0, vy=0, hp=100;
    int face, move=0, time=0, cooldown=0, hit=0, flash=0;
    int blocking=0, crouching=0, queued=0, combo=0, lastPunch=-1000, label=0;
};
Fighter player, rival;
int tick=0, previous=0, ended=0;
int pressed(int mask,int bit){return (mask&bit)&&!(previous&bit);}
void begin(Fighter& f,int id){
    if(ended||id<1||id>7)return;
    if(f.cooldown>0){f.queued=id;return;}
    const MoveDef& m=moves[id];f.move=id;f.time=m.duration;f.cooldown=m.recovery;f.hit=0;f.label=34;
}
void hit(Fighter& from,Fighter& to){
    if(!from.move||from.hit)return;
    const MoveDef& m=moves[from.move];
    if(from.time>m.active||from.time<m.active-4)return;
    if(std::abs(from.x-to.x)>m.range||std::abs(from.y-to.y)>(m.kind==2?105:m.kind==3?180:100))return;
    if(from.face!=(to.x>from.x?1:-1))return;
    from.hit=1;const bool guarded=to.blocking&&to.face==-from.face;
    to.hp=std::max(0.0,to.hp-(guarded?m.damage*.18:m.damage));
    to.vx=from.face*(guarded?1.5:(m.kind==1||m.kind==2?7.0:4.5));
    if(!guarded)to.flash=10;
    from.label=guarded?34:30;
    if(to.hp<=0)ended=&from==&player?1:-1;
}
void update(Fighter& f,Fighter& other,int mask,bool human){
    f.cooldown=std::max(0,f.cooldown-1);f.flash=std::max(0,f.flash-1);f.label=std::max(0,f.label-1);
    f.vx*=.78;f.vy+=.7;f.x+=f.vx;f.y+=f.vy;
    if(f.y>GROUND){f.y=GROUND;f.vy=0;}
    f.x=std::clamp(f.x,55.0,905.0);f.face=other.x>f.x?1:-1;
    f.blocking=0;f.crouching=0;
    if(human){
        if(mask&LEFT)f.vx=-4;if(mask&RIGHT)f.vx=4;
        if(pressed(mask,JUMP)&&f.y>=GROUND)f.vy=-13;
        f.blocking=(mask&GUARD)!=0;f.crouching=(mask&CROUCH)!=0;
        if(pressed(mask,PUNCH)){
            if(f.y<GROUND-8)begin(f,6);
            else {if(tick-f.lastPunch<42)f.combo=(f.combo%3)+1;else f.combo=1;f.lastPunch=tick;begin(f,f.combo);}
        }
        if(pressed(mask,KICK))begin(f,f.y<GROUND-8?6:4);
        if(pressed(mask,SWEEP))begin(f,5);
        if(pressed(mask,SWORD))begin(f,7);
    } else {
        const double dx=other.x-f.x;
        if(std::abs(dx)>82)f.vx=(dx>0?1:-1)*2.25;
        if(std::abs(dx)<160&&other.move&&!other.hit&&std::rand()%100<24)f.blocking=1;
        if(std::abs(dx)<155&&f.cooldown==0&&std::rand()%100<5)begin(f,1+std::rand()%5);
    }
    if(f.cooldown==0&&f.queued){const int id=f.queued;f.queued=0;begin(f,id);}
    if(f.move){--f.time;hit(f,other);if(f.time<=0)f.move=0;}
}
}

extern "C" {
void game_reset(){player=Fighter{};player.x=290;player.y=GROUND;player.face=1;rival=Fighter{};rival.x=670;rival.y=GROUND;rival.face=-1;tick=0;previous=0;ended=0;}
int game_step(int mask){if(!ended){++tick;update(player,rival,mask,true);update(rival,player,0,false);}previous=mask;return ended;}
double game_player_x(){return player.x;} double game_player_y(){return player.y;} double game_player_hp(){return player.hp;}
double game_rival_x(){return rival.x;} double game_rival_y(){return rival.y;} double game_rival_hp(){return rival.hp;}
int game_player_move(){return player.move;} int game_rival_move(){return rival.move;}
double game_player_progress(){return player.move?1.0-double(player.time)/moves[player.move].duration:0.0;}
double game_rival_progress(){return rival.move?1.0-double(rival.time)/moves[rival.move].duration:0.0;}
int game_player_guard(){return player.blocking;} int game_rival_guard(){return rival.blocking;}
int game_player_crouch(){return player.crouching;} int game_rival_crouch(){return rival.crouching;}
int game_player_flash(){return player.flash;} int game_rival_flash(){return rival.flash;}
int game_player_label(){return player.label;} int game_rival_label(){return rival.label;} int game_over(){return ended;}
}

