// Level Verification Script
// Run this in browser console to check all levels for impossible jumps

function verifyAllLevels() {
    const MAX_JUMP = 90; // pixels
    const issues = [];

    // Player starts at y:560 (feet), platforms at y value
    for (let levelNum = 1; levelNum <= 10; levelNum++) {
        const level = levels[levelNum];
        if (!level) continue;

        console.log(`\n=== LEVEL ${levelNum} ===`);
        
        const platforms = [...level.platforms].sort((a, b) => b.y - a.y); // Bottom to top
        let currentY = 560; // Player feet position on ground
        let errors = [];

        for (let i = 0; i < platforms.length; i++) {
            const platform = platforms[i];
            const jumpRequired = currentY - platform.y;
            const reachable = jumpRequired <= MAX_JUMP;
            
            const status = reachable ? '✓' : '✗ IMPOSSIBLE';
            console.log(`  Platform ${i + 1} at y:${platform.y} | Jump: ${jumpRequired}px | ${status}`);
            
            if (!reachable) {
                errors.push(`Platform at y:${platform.y} requires ${jumpRequired}px jump (max: ${MAX_JUMP}px)`);
            }
            
            currentY = platform.y; // Update position for next jump
        }

        if (errors.length > 0) {
            issues.push({ level: levelNum, errors });
            console.log(`  ⚠️  ERRORS FOUND:`, errors);
        } else {
            console.log(`  ✓ All platforms reachable!`);
        }
    }

    console.log('\n=== SUMMARY ===');
    if (issues.length === 0) {
        console.log('✓ All levels verified - all jumps are possible!');
    } else {
        console.log(`✗ ${issues.length} level(s) have impossible jumps:`);
        issues.forEach(({ level, errors }) => {
            console.log(`  Level ${level}: ${errors.join(', ')}`);
        });
    }
}

verifyAllLevels();
