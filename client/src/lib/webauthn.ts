export async function enrollBiometric(userName: string, userEmail: string): Promise<any> {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  
  const publicKeyCreationOptions: PublicKeyCredentialCreationOptions = {
    challenge: challenge,
    rp: {
      name: "GreenPay",
      id: window.location.hostname,
    },
    user: {
      id: crypto.getRandomValues(new Uint8Array(16)),
      name: userEmail,
      displayName: userName,
    },
    pubKeyCredParams: [
      { alg: -7, type: "public-key" },
      { alg: -257, type: "public-key" },
    ],
    timeout: 60000,
    attestation: "direct",
    userVerification: "preferred",
  };

  try {
    const credential = await navigator.credentials.create({
      publicKey: publicKeyCreationOptions,
    }) as PublicKeyCredential | null;

    if (!credential) throw new Error("Failed to create biometric credential");

    return {
      credentialId: credential.id,
      credential: credential,
      rawId: credential.id,
    };
  } catch (error: any) {
    throw new Error(`Biometric enrollment failed: ${error.message}`);
  }
}

export async function verifyBiometric(): Promise<any> {
  const challenge = crypto.getRandomValues(new Uint8Array(32));

  const assertionOptions: PublicKeyCredentialRequestOptions = {
    challenge: challenge,
    timeout: 60000,
    userVerification: "preferred",
  };

  try {
    const assertion = await navigator.credentials.get({
      publicKey: assertionOptions,
    }) as PublicKeyCredential | null;

    if (!assertion) throw new Error("Biometric verification cancelled");

    return {
      credentialId: assertion.id,
      response: assertion.response,
    };
  } catch (error: any) {
    throw new Error(`Biometric verification failed: ${error.message}`);
  }
}
