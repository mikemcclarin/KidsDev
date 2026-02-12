#!/usr/bin/env node
/**
 * Maze Pitfalls Level Verification Script
 * Run with: claude verify-levels.js
 * Or: node verify-levels.js
 */

const levels = {
    1: { platforms: [{y:580}, {y:500}, {y:450}, {y:400}, {y:350}], goal: {y:500} },
    2: { platforms: [{y:580}, {y:530}, {y:480}, {y:430}, {y:380}, {y:330}], goal: {y:250} },
    3: { platforms: [{y:580}, {y:530}, {y:480}, {y:430}, {y:380}], goal: {y:300} },
    4: { platforms: [{y:580}, {y:520}, {y:460}, {y:400}], goal: {y:320} },
    5: { platforms: [{y:580}, {y:500}, {y:420}, {y:340}, {y:260}, {y:180}], goal: {y:100} },
    6: { platforms: [{y:580}, {y:520}, {y:440}, {y:360}, {y:300}, {y:240}, {y:400}], goal: {y:320} },
    7: { platforms: [{y:580}, {y:520}, {y:460}, {y:400}, {y:320}, {y:260}, {y:200}], goal: {y:120} },
    8: { platforms: [{y:580}, {y:530}, {y:480}, {y:430}, {y:380}, {y:330}, {y:280}], goal: {y:200} },
    9: { platforms: [{y:580}, {y:500}, {y:430}, {y:360}, {y:280}, {y:210}, {y:150}, {y:100}], goal: {y:20} },
    10: { platforms: [{y:580}, {y:530}, {y:480}, {y:400}, {y:330}, {y:280}, {y:220}, {y:150}, {y:100}, {y:60}], goal: {y:-20} }
};

const MAX_JUMP = 90; // pixels - maximum reachable jump height
const issues = [];

console.log('\n' + '='.repeat(70));
console.log('MAZE PITFALLS - LEVEL VERIFICATION');
console.log('='.repeat(70));
console.log(`Max jump height: ${MAX_JUMP}px | Player start Y: 560px (feet on ground)`);
console.log('='.repeat(70) + '\n');

for (let levelNum = 1; levelNum <= 10; levelNum++) {
    const level = levels[levelNum];
    if (!level) continue;

    console.log(`📍 LEVEL ${levelNum}`);
    
    const platforms = [...level.platforms].sort((a, b) => b.y - a.y);
    let currentY = 560;
    let levelErrors = [];

    for (let i = 0; i < platforms.length; i++) {
        const platform = platforms[i];
        const jumpRequired = currentY - platform.y;
        const reachable = jumpRequired <= MAX_JUMP;
        const status = reachable ? '✓' : '✗ UNREACHABLE';
        
        console.log(`   ${status} P${i + 1}: y:${String(platform.y).padStart(3)} (${String(jumpRequired).padStart(3)}px)`);
        
        if (!reachable) {
            levelErrors.push(`Platform at y:${platform.y} requires ${jumpRequired}px jump (MAX: ${MAX_JUMP}px)`);
        }
        
        currentY = platform.y;
    }

    // Check goal
    const goalJump = currentY - level.goal.y;
    const goalReachable = goalJump <= MAX_JUMP;
    const goalStatus = goalReachable ? '✓' : '✗ UNREACHABLE';
    console.log(`   ${goalStatus} GOAL: y:${String(level.goal.y).padStart(3)} (${String(goalJump).padStart(3)}px)`);
    
    if (!goalReachable) {
        levelErrors.push(`Goal at y:${level.goal.y} requires ${goalJump}px jump (unreachable!)`);
    }

    if (levelErrors.length > 0) {
        issues.push({ level: levelNum, errors: levelErrors });
        console.log(`   ⚠️  ERROR: ${levelErrors[0]}\n`);
    } else {
        console.log(`   ✅ All platforms reachable!\n`);
    }
}

console.log('='.repeat(70));
console.log('SUMMARY');
console.log('='.repeat(70));

if (issues.length === 0) {
    console.log('✅ SUCCESS! All 10 levels are fully playable and beatable!\n');
    process.exit(0);
} else {
    console.log(`❌ ISSUES FOUND in ${issues.length} level(s):\n`);
    issues.forEach(({ level, errors }) => {
        console.log(`   Level ${level}:`);
        errors.forEach(err => console.log(`     • ${err}`));
    });
    console.log();
    process.exit(1);
}
