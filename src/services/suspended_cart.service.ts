import dataSource from "@config/database";
import { EntityNotFoundError } from "@errors/custom_error";
import { SuspendedCart } from "@models/suspended_cart.model";
import { User } from "@models/user.model";
import { UUID } from "types/common_type";
import {
  CreateSuspendedCartBody,
  ResumeSuspendedCartBody,
  SuspendedCartItem,
} from "types/suspended_cart";

export type ResumeSuspendedCartResult = {
  items: SuspendedCartItem[];
  suspended: SuspendedCart[];
};

export class SuspendedCartService {
  private repository = dataSource.getRepository(SuspendedCart);

  public async list(user: User): Promise<SuspendedCart[]> {
    return await this.repository.find({
      where: { cashierId: user.id },
      order: { savedAt: "ASC" },
    });
  }

  public async create(
    body: CreateSuspendedCartBody,
    user: User,
  ): Promise<SuspendedCart> {
    const suspendedCart = this.repository.create({
      cashierId: user.id,
      label: body.label?.trim() || this.defaultLabel("Suspend"),
      items: body.items,
    });
    return await this.repository.save(suspendedCart);
  }

  public async resume(
    id: UUID,
    body: ResumeSuspendedCartBody,
    user: User,
  ): Promise<ResumeSuspendedCartResult> {
    return await dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(SuspendedCart);
      const suspendedCart = await repository.findOne({
        where: { id, cashierId: user.id },
        lock: { mode: "pessimistic_write" },
      });
      if (!suspendedCart) {
        throw new EntityNotFoundError("SuspendedCart", {
          id,
          cashierId: user.id,
        });
      }

      const resumedItems = suspendedCart.items;
      await repository.remove(suspendedCart);

      if (body.currentItems?.length) {
        await repository.save(
          repository.create({
            cashierId: user.id,
            label: this.defaultLabel("Auto suspend"),
            items: body.currentItems,
          }),
        );
      }

      const suspended = await repository.find({
        where: { cashierId: user.id },
        order: { savedAt: "ASC" },
      });
      return { items: resumedItems, suspended };
    });
  }

  public async remove(id: UUID, user: User): Promise<void> {
    const suspendedCart = await this.repository.findOne({
      where: { id, cashierId: user.id },
    });
    if (!suspendedCart) {
      throw new EntityNotFoundError("SuspendedCart", {
        id,
        cashierId: user.id,
      });
    }
    await this.repository.remove(suspendedCart);
  }

  private defaultLabel(prefix: string): string {
    const time = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date());
    return `${prefix} ${time}`;
  }
}
