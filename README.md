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

---

### `payok.uuid`

Generates a UUID for fields like `merchantOrderId` that must be unique per request.

```json
{ "merchantOrderId": "${[ payok.uuid() ]}" }
```

---

## How caching works

`payok.signature` expires both caches before rendering the body. This guarantees:

1. **Uniqueness** — each request send gets a fresh UUID and timestamp, even when requests are sent in rapid succession.
2. **Consistency** — the body used to compute the signature is identical to the body sent in the request.

```
payok.signature renders
  → expires UUID + timestamp caches
  → renders body → payok.uuid() and payok.timestamp() generate fresh values and cache them
  → signs body with those values

Yaak sends actual request
  → renders body → payok.uuid() and payok.timestamp() return cached values  ✓
```

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
