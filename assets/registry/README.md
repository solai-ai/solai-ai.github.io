# SOLAI DApp Interest Registry

This directory stores the public-by-URL DApp interest registry used by the SOLAI
institutional website.

## Registry file

Public path after GitHub Pages deployment:

```text
/assets/registry/solai-dapp-interest-7d3f6b81.json
```

Local file:

```text
assets/registry/solai-dapp-interest-7d3f6b81.json
```

The random suffix is intentional. The file is not linked from the footer or main
navigation, but anyone with the URL can read it.

## Schema

```json
{
  "registry": "SOLAI DApp Interest",
  "visibility": "public-by-url",
  "updated_at": "2026-08-23T00:00:00Z",
  "entries": [
    {
      "id": "dapp_example",
      "name": "Builder Name",
      "company": "Company or Project",
      "email": "builder@example.com",
      "segment": "AI Agents",
      "description": "Short description of the intended DApp inference workload.",
      "submitted_at": "2026-08-23T00:00:00Z"
    }
  ]
}
```

## Update flow

1. Open `dapps.html` through the deployed site or a local static server.
2. Submit a DApp interest entry through the form.
3. Use `Download JSON` or `Copy JSON`.
4. Replace the contents of `assets/registry/solai-dapp-interest-7d3f6b81.json`.
5. Commit and push when ready to publish.

GitHub Pages is static, so the form cannot write directly to this JSON file on the
server. Until a backend is connected, publishing new entries requires updating this
file in the repository.

## Visibility note

Emails in this file are intentionally treated as public once committed and deployed.
Do not add private or sensitive contact data unless public exposure is acceptable.
