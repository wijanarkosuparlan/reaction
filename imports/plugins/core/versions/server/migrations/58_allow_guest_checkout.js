import { Migrations } from "meteor/percolate:migrations";
import { Packages, Shops } from "/lib/collections";

Migrations.add({
  version: 58,
  up() {
    Packages.find({
      "name": "core",
      "settings.public.allowGuestCheckout": { $exists: true }
    }).forEach((corePkg) => {
      Shops.update({ _id: corePkg.shopId }, {
        $set: {
          isGuestCheckoutAllowed: !!(corePkg.settings && corePkg.settings.public && corePkg.settings.public.allowGuestCheckout)
        }
      }, { bypassCollection2: true });

      Packages.update({ _id: corePkg._id }, {
        $unset: {
          "settings.public.allowGuestCheckout": ""
        }
      }, { bypassCollection2: true });
    });
  },
  down() {
    Packages.find({
      "name": "core",
      "settings.public.allowGuestCheckout": { $exists: false }
    }).forEach((corePkg) => {
      const shop = Shops.findOne({ _id: corePkg.shopId }, { fields: { isGuestCheckoutAllowed: 1 } });

      Packages.update({ _id: corePkg._id }, {
        $set: {
          "settings.public.allowGuestCheckout": shop.isGuestCheckoutAllowed
        }
      }, { bypassCollection2: true });

      Shops.update({ _id: corePkg.shopId }, {
        $unset: {
          isGuestCheckoutAllowed: ""
        }
      }, { bypassCollection2: true });
    });
  }
});
