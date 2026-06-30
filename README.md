# PAYOK Signature Generator

Yaak plugin to generate PAYOK RSA-SHA256 digital signatures directly inside your requests.

---

## Template Functions

### `payok.signature`

Generates the `sign` header value. The plugin reads the request body automatically — no need to copy it into the arguments.

**Setup:**
1. In the **Headers** tab, add a header named `sign`
2. In the value field, type `payok` and select `payok.signature` from autocomplete
3. Fill in the dialog:
   - **Endpoint Path** — e.g. `/api-pay/payment/V3.2/order/create-api`
   - **Private Key** — your PKCS#8 RSA private key in Base64, or an environment variable reference
4. Click **Save**

---

### `payok.timestamp`

Generates the current ISO8601 timestamp (e.g. `2024-01-15T10:30:00.123Z`).

In the request body, place your cursor inside the `requestTime` value and select `payok.timestamp` from the template tag autocomplete.

```json
{ "requestTime": "${[ payok.timestamp() ]}" }
```

The timestamp is cached for 10 seconds so the value in the body and the signed body always match.

---

## Private Key Formats

Both formats are accepted:

```
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSj...
```

```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSj...
-----END PRIVATE KEY-----
```

> If your key starts with `-----BEGIN RSA PRIVATE KEY-----` (PKCS#1), convert it first:
> ```bash
> openssl pkcs8 -topk8 -nocrypt -in rsa_private.pem -out pkcs8_private.pem
> ```

---

## Signing Algorithm

```
message   = <request_body_string> + "&" + <endpoint_path>
signature = Base64( RSA-SHA256-sign(privateKey, message) )
```
