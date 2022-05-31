import client from "@libs/client/client";
import withHandler, {
  ResponseType,
} from "@libs/server/withHandler";
// prettier-ignore
import type { NextApiRequest, NextApiResponse, NextApiHandler } from "next";
import { withApiSession } from "@libs/server/withSession";

const handler: NextApiHandler = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  // id -> string / string[] cause of dynamic routing
  const {
    query: { id },
    session: { user },
  } = req;

  const product = await client.product.findUnique({
    where: { id: +id.toString() },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const terms = product?.name.split(" ").map((word) => ({
    name: {
      contains: word,
    },
  }));

  const relatedProducts = await client.product.findMany({
    where: {
      OR: terms,
      AND: {
        id: {
          not: product?.id,
        },
      },
    },
  });

  const isLiked = Boolean(
    await client.fav.findFirst({
      // fav의 productId중에 product.id가 있는지 없는지 체크
      where: {
        productId: product?.id,
        userId: user?.id,
      },
    })
  );
  res.json({ ok: true, product, isLiked, relatedProducts });
};

export default withApiSession(
  withHandler({
    methods: ["GET"],
    handler,
  })
);