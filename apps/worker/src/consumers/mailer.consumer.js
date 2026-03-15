export async function handleOtpRequested(payload) {
  const { email, otp } = payload || {}
  if (!email || !otp) return
  console.log(`[worker] OTP stub -> ${email}: ${otp}`)
}
