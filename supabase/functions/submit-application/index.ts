// One-tap Apply: composes and sends an adoption application email to the shelter on the
// user's behalf, using their saved adopter profile. See docs/PLAN.md section 7 -- the
// architecture diagram calls this destination "Shelter's own form/email"; email is the
// honest, buildable V1 version since there's no universal API to submit into an arbitrary
// shelter's own web form.
//
// Runs with the CALLING USER's identity (their JWT is forwarded), not the service role --
// row-level security on applications/adopter_profiles already restricts each user to their
// own rows, so no elevated access is needed here.
//
// Secrets required (set via Supabase dashboard > Edge Functions > Manage secrets):
//   RESEND_API_KEY   — from resend.com dashboard > API Keys
// Auto-provided by Supabase Edge Functions:
//   SUPABASE_URL, SUPABASE_ANON_KEY

import { createClient } from 'jsr:@supabase/supabase-js@2';

const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM_ADDRESS = 'Pawswipe <onboarding@resend.dev>';

// The app is called from a browser during development (and possibly a web build later),
// which enforces CORS -- unlike a plain server-to-server fetch, the browser blocks the
// response unless these headers are present, including on the preflight OPTIONS request.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function fieldValues(profile: Record<string, unknown> | null) {
  const p = profile ?? {};
  const householdNotes = (p.household_members as { notes?: string } | null)?.notes ?? 'Not provided';
  const referenceNotes = (p.references as { notes?: string } | null)?.notes ?? 'Not provided';
  const yesNo = (value: unknown) =>
    value === null || value === undefined ? 'Not provided' : value ? 'Yes' : 'No';

  return [
    ['Housing type', String(p.housing_type ?? 'Not provided')],
    ['Has a yard', yesNo(p.has_yard)],
    ['Yard fenced', yesNo(p.yard_fenced)],
    ['Work schedule', String(p.work_schedule ?? 'Not provided')],
    ['Household', householdNotes],
    ['Pet experience', String(p.pet_experience ?? 'Not provided')],
    ['References', referenceNotes],
  ] as [string, string][];
}

function composeEmailText(params: {
  animalName: string;
  requesterEmail: string;
  profile: Record<string, unknown> | null;
}): string {
  const { animalName, requesterEmail, profile } = params;
  const fields = fieldValues(profile);

  return [
    `A Pawswipe user would like to apply to adopt ${animalName}.`,
    ``,
    `Contact email: ${requesterEmail}`,
    ``,
    ...fields.map(([label, value]) => `${label}: ${value}`),
    ``,
    `Sent via Pawswipe.`,
  ].join('\n');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function composeEmailHtml(params: {
  animalName: string;
  requesterEmail: string;
  profile: Record<string, unknown> | null;
}): string {
  const { animalName, requesterEmail, profile } = params;
  const fields = fieldValues(profile);
  const name = escapeHtml(animalName);
  const email = escapeHtml(requesterEmail);

  const rows = fields
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 0;border-top:1px solid #f0f0f0;color:#888;font-size:13px;width:150px;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="padding:10px 0;border-top:1px solid #f0f0f0;color:#222;font-size:14px;vertical-align:top;">${escapeHtml(value)}</td>
        </tr>`
    )
    .join('');

  return `
    <div style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;">
      <div style="background:#ff7a59;padding:24px;border-radius:12px 12px 0 0;">
        <p style="margin:0;color:#ffe4da;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Pawswipe adoption application</p>
        <h1 style="margin:6px 0 0;color:#fff;font-size:24px;">${name}</h1>
      </div>
      <div style="border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px;padding:24px;">
        <p style="margin:0 0 12px;font-size:15px;color:#333;">
          A Pawswipe user would like to apply to adopt <strong>${name}</strong>.
          Reply directly to this email to reach them at <a href="mailto:${email}" style="color:#ff7a59;">${email}</a>.
        </p>
        <table style="width:100%;border-collapse:collapse;">${rows}</table>
        <p style="margin:24px 0 0;font-size:12px;color:#aaa;">Sent via Pawswipe.</p>
      </div>
    </div>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const { applicationId } = await req.json();
    if (!applicationId) {
      return jsonResponse({ error: 'applicationId is required' }, 400);
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return jsonResponse({ error: 'RESEND_API_KEY is not set' }, 500);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ error: 'Not authenticated' }, 401);
    }

    const { data: application, error: applicationError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single();
    if (applicationError || !application) {
      return jsonResponse({ error: 'Application not found' }, 404);
    }

    const { data: animal, error: animalError } = await supabase
      .from('animals')
      .select('name, shelter_name, shelter_contact')
      .eq('id', application.animal_id)
      .single();
    if (animalError || !animal) {
      return jsonResponse({ error: 'Animal not found' }, 404);
    }

    const shelterEmail = (animal.shelter_contact as { email?: string } | null)?.email;
    if (!shelterEmail) {
      const { data: updated } = await supabase
        .from('applications')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', applicationId)
        .select()
        .single();
      return jsonResponse({
        error: "We don't have a way to reach this shelter yet.",
        application: updated,
      });
    }

    const { data: profile } = await supabase
      .from('adopter_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    const emailParams = {
      animalName: animal.name,
      requesterEmail: user.email ?? 'unknown',
      profile,
    };

    const resendResponse = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [shelterEmail],
        reply_to: user.email ?? undefined,
        subject: `Adoption application for ${animal.name} (via Pawswipe)`,
        html: composeEmailHtml(emailParams),
        text: composeEmailText(emailParams),
      }),
    });

    if (!resendResponse.ok) {
      const body = await resendResponse.text();
      const { data: updated } = await supabase
        .from('applications')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', applicationId)
        .select()
        .single();
      return jsonResponse({
        error: `Resend API error ${resendResponse.status}: ${body}`,
        application: updated,
      });
    }

    const { data: updated, error: updateError } = await supabase
      .from('applications')
      .update({
        status: 'submitted',
        submitted_data: profile ?? {},
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (updateError) {
      return jsonResponse({ error: updateError.message }, 500);
    }

    return jsonResponse({ application: updated });
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500);
  }
});
