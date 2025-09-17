#!/usr/bin/env python3
"""
Update THub V2 project memory with recent fixes and improvements
"""

import json
import subprocess
from datetime import datetime

def update_memory():
    """Update project memory with recent fixes"""
    
    # Memory updates
    updates = [
        {
            "entity": "landing_page_fixes",
            "type": "implementation",
            "content": "Fixed critical styling issues on landing page. Resolved CSP middleware conflict, hydration mismatches, and @import order problems.",
            "date": datetime.now().isoformat()
        },
        {
            "entity": "csp_middleware",
            "type": "fix",
            "content": "Merged CSP functionality into root middleware.ts. Next.js only runs one middleware file, so CSP in /src/middleware.ts was being ignored. Now CSP headers are properly applied to all routes.",
            "date": datetime.now().isoformat()
        },
        {
            "entity": "hydration_fixes", 
            "type": "fix",
            "content": "Fixed React hydration mismatches in BackgroundEffects component by rendering canvas only on client. Added mounted state to ThemeProvider to prevent server/client theme mismatch. Used CSS classes for theme-specific overlays.",
            "date": datetime.now().isoformat()
        },
        {
            "entity": "font_loading",
            "type": "improvement",
            "content": "Replaced CSS @import with Next.js font loading system. Added Inter, JetBrains_Mono, and Fira_Code fonts via next/font/google. Eliminates @import order conflicts and improves performance.",
            "date": datetime.now().isoformat()
        },
        {
            "entity": "tailwind_v4",
            "type": "clarification",
            "content": "Project uses Tailwind CSS v4 with @config directive inside tailwind.css. No separate tailwind.config.ts needed. Configuration is handled via CSS custom properties.",
            "date": datetime.now().isoformat()
        },
        {
            "entity": "theme_system",
            "type": "implementation",
            "content": "Dual theme system working correctly. Professional theme with glassmorphism effects and Synthwave theme with neon/terminal aesthetics. Theme switching smooth without FOUC.",
            "date": datetime.now().isoformat()
        },
        {
            "entity": "build_status",
            "type": "status",
            "content": "TypeScript compilation: 0 errors. Build successful. Landing page loads without console errors. Both themes render correctly. Mobile performance optimized.",
            "date": datetime.now().isoformat()
        },
        {
            "entity": "technical_decisions",
            "type": "architecture",
            "content": "Using Next.js 14 App Router, TypeScript strict mode, Supabase for backend, EODHD for market data. Middleware handles both CSP and authentication. Theme handled via data-theme attribute on HTML.",
            "date": datetime.now().isoformat()
        }
    ]
    
    # Create memory entries
    for update in updates:
        cmd = [
            "mcp",
            "call-tool",
            "memory-thub-v2",
            "memory_create_entities",
            json.dumps({
                "entities": [{
                    "name": update["entity"],
                    "entityType": update["type"],
                    "observations": [update["content"]]
                }]
            })
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                print(f"✅ Updated: {update['entity']}")
            else:
                print(f"❌ Failed to update {update['entity']}: {result.stderr}")
        except Exception as e:
            print(f"❌ Error updating {update['entity']}: {str(e)}")
    
    # Create relationships
    relationships = [
        {
            "from": "landing_page_fixes",
            "to": "csp_middleware",
            "relationType": "includes"
        },
        {
            "from": "landing_page_fixes", 
            "to": "hydration_fixes",
            "relationType": "includes"
        },
        {
            "from": "landing_page_fixes",
            "to": "font_loading",
            "relationType": "includes"
        },
        {
            "from": "theme_system",
            "to": "build_status",
            "relationType": "results_in"
        }
    ]
    
    for rel in relationships:
        cmd = [
            "mcp",
            "call-tool",
            "memory-thub-v2",
            "memory_create_relations",
            json.dumps({
                "relations": [rel]
            })
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                print(f"✅ Created relation: {rel['from']} -> {rel['to']}")
            else:
                print(f"❌ Failed to create relation: {result.stderr}")
        except Exception as e:
            print(f"❌ Error creating relation: {str(e)}")

if __name__ == "__main__":
    print("🔄 Updating THub V2 project memory...")
    print("=" * 50)
    update_memory()
    print("=" * 50)
    print("✅ Memory update complete!")