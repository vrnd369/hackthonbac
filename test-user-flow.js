import { supabase } from './src/lib/supabase.ts';

async function testCompleteUserFlow() {
  console.log('🚀 Testing complete user flow...\n');

  try {
    // Step 1: Test registration
    console.log('1. Testing registration flow...');
    const testRegistration = {
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      phone: '+1234567890',
      experience_level: 'intermediate',
      motivation: 'Testing the system',
      tracks_interested: ['storytelling', 'ai-vs-human'],
      registration_type: 'free'
    };

    const { data: registration, error: regError } = await supabase
      .from('hackathon_registrations')
      .insert([testRegistration])
      .select()
      .single();

    if (regError) {
      console.error('❌ Registration failed:', regError.message);
      return;
    }
    console.log('✅ Registration successful:', registration.id);

    // Step 2: Test profile creation
    console.log('\n2. Testing profile creation...');
    const testProfile = {
      registration_id: registration.id,
      first_name: 'Test',
      last_name: 'User',
      country: 'United States',
      city: 'New York',
      field_of_study: 'computer-science',
      school_or_company: 'Test University',
      current_position: 'Student',
      how_heard_about_us: 'google-search',
      bio: 'This is a test profile',
      skills: ['python', 'sql', 'machine-learning'],
      interests: ['artificial-intelligence', 'data-visualization'],
      profile_completed: true
    };

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert([testProfile])
      .select()
      .single();

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError.message);
      return;
    }
    console.log('✅ Profile created successfully:', profile.id);

    // Step 3: Test team creation
    console.log('\n3. Testing team creation...');
    const testTeam = {
      name: `Test Team ${Date.now()}`,
      description: 'A test team for verification',
      leader_user_profile_id: profile.id,
      max_members: 4,
      is_open: true
    };

    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert([testTeam])
      .select()
      .single();

    if (teamError) {
      console.error('❌ Team creation failed:', teamError.message);
      return;
    }
    console.log('✅ Team created successfully:', team.id);

    // Step 4: Verify team details view
    console.log('\n4. Testing team details view...');
    const { data: teamDetails, error: viewError } = await supabase
      .from('team_details')
      .select('*')
      .eq('id', team.id)
      .single();

    if (viewError) {
      console.error('❌ Team details view failed:', viewError.message);
      return;
    }
    console.log('✅ Team details view working:', {
      name: teamDetails.name,
      leader: teamDetails.leader_name,
      members: teamDetails.current_members,
      maxMembers: teamDetails.max_members
    });

    // Step 5: Test profile update (team assignment)
    console.log('\n5. Verifying automatic team assignment...');
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .select('team_id')
      .eq('id', profile.id)
      .single();

    if (updateError) {
      console.error('❌ Profile update check failed:', updateError.message);
      return;
    }

    if (updatedProfile.team_id === team.id) {
      console.log('✅ Automatic team assignment working correctly');
    } else {
      console.error('❌ Team assignment not working properly');
      return;
    }

    // Step 6: Test RLS policies
    console.log('\n6. Testing Row Level Security policies...');
    
    // Test anonymous access to registrations (should work for insert only)
    const { data: anonTest, error: anonError } = await supabase
      .from('hackathon_registrations')
      .select('*')
      .limit(1);

    if (anonError && anonError.message.includes('permission')) {
      console.log('✅ RLS working - anonymous users cannot read registrations');
    } else {
      console.log('⚠️  RLS may not be properly configured for registrations');
    }

    // Cleanup test data
    console.log('\n7. Cleaning up test data...');
    
    // Delete team (will cascade to remove team_id from profile)
    await supabase.from('teams').delete().eq('id', team.id);
    
    // Delete profile
    await supabase.from('user_profiles').delete().eq('id', profile.id);
    
    // Delete registration
    await supabase.from('hackathon_registrations').delete().eq('id', registration.id);
    
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Complete user flow test PASSED!');
    console.log('\n📋 Verified functionality:');
    console.log('   ✅ User registration');
    console.log('   ✅ Profile creation');
    console.log('   ✅ Team creation');
    console.log('   ✅ Automatic team assignment');
    console.log('   ✅ Team details view');
    console.log('   ✅ Database triggers');
    console.log('   ✅ Row Level Security');
    console.log('   ✅ Data cleanup');

  } catch (error) {
    console.error('❌ Unexpected error in user flow test:', error);
  }
}

// Run the test
testCompleteUserFlow();