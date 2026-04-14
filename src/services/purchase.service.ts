import dataSource from "@config/database";
import { CANCELLED, PENDING, POSTED } from "@constants/status";
import { EntityNotFoundError } from "@errors/custom_error";
import { Product } from "@models/product.model";
import { Purchase } from "@models/purchase.model";
import { User } from "@models/user.model";
import { Vendor } from "@models/vendor.model";
import { UUID } from "types/common_type";
import {
  ChangeStatusPurchase,
  CreatePurchase,
  UpdatePurchase,
} from "types/purchase.type";

export class PurchaseService {
  public async createPurchase(
    user: User,
    body: CreatePurchase,
  ): Promise<Purchase> {
    return await dataSource.transaction(async (transactionalEntityManager) => {
      const product = await transactionalEntityManager.findOne(Product, {
        where: { id: body.product_id },
      });
      if (!product)
        throw new EntityNotFoundError("product tidak ada", {
          id: body.product_id,
        });
      const vendor = await transactionalEntityManager.findOne(Vendor, {
        where: { id: body.vendor_id },
      });
      if (!vendor)
        throw new EntityNotFoundError("vendor tidak ada", {
          id: body.vendor_id,
        });
      const purchase = new Purchase();
      purchase.productId = body.product_id;
      purchase.vendorId = body.vendor_id;
      purchase.purchaseDate = body.purchase_date;
      purchase.status = PENDING;
      purchase.qty = body.qty;
      purchase.createdById = user.id;
      purchase.updatedById = user.id;
      return await transactionalEntityManager.save(purchase);
    });
  }

  public async updateStatus(
    user: User,
    body: ChangeStatusPurchase,
  ): Promise<Purchase> {
    return await dataSource.transaction(async (transactionalEntityManager) => {
      const purchase = await transactionalEntityManager.findOne(Purchase, {
        where: { id: body.id },
      });
      if (!purchase)
        throw new EntityNotFoundError("purchase tidak ada", {
          id: body.id,
        });
      const allowedChange: { [key: string]: string[] } = {
        [PENDING]: [POSTED, CANCELLED],
        [POSTED]: [CANCELLED],
        [CANCELLED]: [],
      };
      if (!allowedChange[purchase.status]?.includes(body.status)) {
        throw new Error("Perubahan status tidak valid");
      }

      if (body.status === POSTED) {
        const product = await transactionalEntityManager.findOne(Product, {
          where: { id: purchase.productId },
        });
        if (!product)
          throw new EntityNotFoundError("product tidak ada", {
            id: purchase.productId,
          });
        product.qty += purchase.qty;
        await transactionalEntityManager.save(product);
      } else if (purchase.status === POSTED && body.status === CANCELLED) {
        const product = await transactionalEntityManager.findOne(Product, {
          where: { id: purchase.productId },
        });
        if (!product)
          throw new EntityNotFoundError("product tidak ada", {
            id: purchase.productId,
          });
        if (product.qty < purchase.qty) {
          throw new Error(
            "Tidak dapat membatalkan purchase karena stok produk tidak mencukupi",
          );
        }
        product.qty -= purchase.qty;
        await transactionalEntityManager.save(product);
      }
      purchase.status = body.status;
      purchase.updatedById = user.id;
      return await transactionalEntityManager.save(purchase);
    });
  }

  public async updatePurchase(
    user: User,
    id: UUID,
    body: UpdatePurchase,
  ): Promise<Purchase> {
    return await dataSource.transaction(async (transactionalEntityManager) => {
      const purchase = await transactionalEntityManager.findOne(Purchase, {
        where: { id: id },
      });
      if (!purchase)
        throw new EntityNotFoundError("purchase tidak ada", {
          id: id,
        });

      if (purchase.status === POSTED)
        throw new Error("Purchase yang sudah diposting tidak bisa diubah");

      if (body.product_id) {
        const product = await transactionalEntityManager.findOne(Product, {
          where: { id: body.product_id },
        });
        if (!product)
          throw new EntityNotFoundError("product tidak ada", {
            id: body.product_id,
          });
        purchase.productId = body.product_id;
      }

      if (body.vendor_id) {
        const vendor = await transactionalEntityManager.findOne(Vendor, {
          where: { id: body.vendor_id },
        });
        if (!vendor)
          throw new EntityNotFoundError("vendor tidak ada", {
            id: body.vendor_id,
          });
        purchase.vendorId = body.vendor_id;
      }

      if (body.purchase_date) purchase.purchaseDate = body.purchase_date;
      if (body.qty) purchase.qty = body.qty;

      purchase.updatedById = user.id;
      return await transactionalEntityManager.save(purchase);
    });
  }
}
