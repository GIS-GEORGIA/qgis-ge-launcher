# Asking Google to support Georgia for Chrome Web Store registration

The Chrome Web Store's one-time developer fee goes through a payment system
whose country list does not include Georgia, so the developer account cannot be
created at all. Google does not publish the list; you find out at the payment
step, when your country is missing from the dropdown.

Chrome DevRel has answered this publicly for other countries — for Pakistan in
[this chromium-extensions thread](https://groups.google.com/a/chromium.org/g/chromium-extensions/c/FWK5U6_EJr8),
saying the region is not supported by the underlying payment system and that
the team is "working on trying to expand the regions where developer
registration is available", with no timeline. Nigeria and
[Sri Lanka](https://groups.google.com/a/chromium.org/g/chromium-extensions/c/QWIBtfsoEMk)
have raised the same thing.

So: a concrete, named request costs nothing and is the only lever that exists.

## Where to post

1. **[chromium-extensions Google Group](https://groups.google.com/a/chromium.org/g/chromium-extensions)** —
   Chrome DevRel reads and replies here. This is the one that has actually drawn
   answers.
2. **[Chrome Web Store developer support](https://support.google.com/chrome_webstore/contact/dev_support_policy)** —
   a formal ticket, so the request is on record.

Post once in each, then leave it. Reposting does not help.

## Draft

Subject:

```
Chrome Web Store developer registration: Georgia (GE) is not a supported payment region
```

Body:

```
Hi,

I am trying to register a Chrome Web Store developer account so I can publish a
Manifest V3 extension, but Georgia (country code GE) does not appear in the
country list when setting up the payment profile for the one-time registration
fee, so the account cannot be created at all.

I have seen the same issue answered here for Pakistan, Nigeria and Sri Lanka,
with the reply that those are not supported regions for the underlying payment
system and that the team is working on expanding the regions where developer
registration is available. I would like to add Georgia to that list of
requests, and ask whether there is any way to register in the meantime.

Details, in case they help:

- Country: Georgia (GE)
- The extension is open source, MIT licensed, Manifest V3:
  https://github.com/GIS-GEORGIA/qgis-ge-launcher
- It requests a single permission ("storage") and makes no network requests.
- The same package is already published on the Microsoft Edge Add-ons store,
  which charges no registration fee and has no regional restriction:
  https://microsoftedge.microsoft.com/addons/detail/mehgilbmgbbcgpmfcdgdmemnmnpkfaom
  So the extension is finished and has passed a store review — the only thing
  standing between it and Chrome users is the payment region.
- I am not looking to work around the restriction with an address I do not
  have — I would rather wait for Georgia to be supported properly.

Two questions:

1. Is there anything a developer in an unsupported country can legitimately do
   today, short of registering a legal entity abroad?
2. Is there a way to be notified when a region becomes available, or a public
   list of the supported countries? Right now the only way to find out is to
   attempt registration and see whether the dropdown contains your country.

Thanks for any guidance.
```

## What to expect

A reply from Chrome DevRel acknowledging the limitation is the realistic best
case; a date is unlikely. Treat it as a vote that the region matters, not as a
fix. Meanwhile Edge Add-ons carries the extension, and Chrome users install from
a [GitHub release](https://github.com/GIS-GEORGIA/qgis-ge-launcher/releases) or
through [managed deployment](../docs/ENTERPRISE.md).

## What not to do

Entering a country or address you do not actually have. It is suggested on
forums, it violates the Developer Agreement, and it gets the account terminated
along with anything published from it. A legal entity you genuinely hold in a
supported country is a different matter and is fine.
