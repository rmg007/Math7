const { createClient } = require('@supabase/supabase-js');

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_ANON_KEY;

if (!URL || !KEY) {
    console.error('❌ SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required');
    process.exit(1);
}

const supabase = createClient(URL, KEY);

async function run() {
  console.log('START_DEMO');

  try {
      // 1. Mentor
      const { data: { session: ms }, error: me } = await supabase.auth.signInWithPassword({
        email: 'testmentor@example.com', password: 'testmentor@example.com'
      });
      if(me) throw new Error('MENTOR_AUTH:' + me.message);

      const mc = createClient(URL, KEY, { global: { headers: { Authorization: `Bearer ${ms.access_token}` } } });

      const { data: appData } = await supabase.from('apps').select('app_id').eq('subdomain', 'm7').maybeSingle();
      const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const p = {
          name: 'Verif_' + joinCode, owner_id: ms.user.id, type: 'class', join_code: joinCode, allow_anonymous_join: true
      };
      if (appData) p.app_id = appData.app_id;

      const { data: g, error: ge } = await mc.from('groups').insert(p).select().single();
      if (ge) throw new Error('GRP_FAIL:' + ge.message);
      console.log('GRP_OK:', g.join_code);

      const { data: q } = await supabase.from('questions').select('skill_id, skills(id, title), id').limit(1).maybeSingle();
      
      await mc.from('assignments').insert({ group_id: g.id, skill_id: q.skill_id, title: 'Demo', due_date: new Date().toISOString() });
      console.log('ASSIGN_OK');

      // 5. Alice (Sign Up New)
      const aliceEmail = 'alice_' + joinCode + '@test.com';
      const { data: asData, error: ae } = await supabase.auth.signUp({ 
        email: aliceEmail, password: 'password123', options: { data: { full_name: 'Alice ' + joinCode } } 
      });
      if(ae) throw new Error('ALICE_SIGNUP:' + ae.message);
      
      let as = asData.session;
      if (!as && asData.user) {
         const { data: li } = await supabase.auth.signInWithPassword({ email: aliceEmail, password: 'password123' });
         as = li.session;
      }
      if (!as) throw new Error('ALICE_NO_SESSION');

      const ac = createClient(URL, KEY, { global: { headers: { Authorization: `Bearer ${as.access_token}` } } });
      const { data: jr, error: je } = await ac.rpc('join_group_by_code', { code: g.join_code });
      
      if (je) throw new Error('RPC_ERR:' + je.message);
      if (!jr.success) throw new Error('RPC_FAIL:' + jr.error);
      console.log('ALICE_JOINED');

      for(let i=0; i<3; i++) {
        const { error: attErr } = await ac.from('attempts').insert({ 
            user_id: as.user.id, 
            question_id: q.id, 
            is_correct: true,
            response: { answer: 'force_verify' },
            score_awarded: 10,
            time_spent_ms: 1000
        });
        if (attErr) throw new Error('ALICE_ATTEMPT_FAIL:' + attErr.message);
      }
      console.log('ALICE_DONE');

      // 7. Bob
      const bobEmail = 'bob_' + joinCode + '@test.com';
      const { data: bsData } = await supabase.auth.signUp({ 
          email: bobEmail, password: 'password123', options: { data: { full_name: 'Bob ' + joinCode } } 
      });
      let bs = bsData.session;
      if (!bs && bsData.user) {
          const { data: li } = await supabase.auth.signInWithPassword({ email: bobEmail, password: 'password123' });
          bs = li.session;
      }
      if (!bs) throw new Error('BOB_NO_SESSION');

      const bc = createClient(URL, KEY, { global: { headers: { Authorization: `Bearer ${bs.access_token}` } } });
      await bc.rpc('join_group_by_code', { code: g.join_code });
      
      const { error: battErr } = await bc.from('attempts').insert({ 
          user_id: bs.user.id, 
          question_id: q.id, 
          is_correct: false,
          response: { answer: 'fail' },
          score_awarded: 0,
          time_spent_ms: 1000
      });
      if (battErr) throw new Error('BOB_ATTEMPT_FAIL:' + battErr.message);

      console.log('BOB_DONE');

      console.log('SUCCESS');

  } catch (e) {
      console.log('FATAL:', e.message);
      process.exit(1);
  }
}
run();
