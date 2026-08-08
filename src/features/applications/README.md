# Applications

The one-tap Apply flow: takes a liked animal + the saved adopter profile and emails the
shelter (via the `submit-application` Edge Function + Resend), since there's no universal
API to submit into an arbitrary shelter's own web form. Tracks status (pending / submitted /
failed / no response yet / update received) and supports retrying a failed send.
