import { Inter } from "next/font/google";
import { IconBrandGithubFilled } from "@tabler/icons-react";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-10">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <a
            className="pointer-events-none flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0"
            href="https://github.com/xiaotianxt/model"
            target="_blank"
            rel="noopener noreferrer"
          >
            Explore on <IconBrandGithubFilled />
          </a>
        </div>
      </div>

      <div className="relative flex-col place-items-center space-y-4">
        <h1 className="text-5xl font-bold text-center">高级地理信息系统</h1>
        <h2 className="text-3xl font-semibold text-center">课程作业</h2>
      </div>

      <div className="mb-32 grid text-center lg:mb-0 lg:grid-cols-2 lg:text-left">
        <Link
          href="/playground"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
        >
          <h2 className={`${inter.className} mb-3 text-2xl font-semibold`}>
            模型在线生成{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p
            className={`${inter.className} m-0 max-w-[30ch] text-sm opacity-50`}
          >
            基于给定点数据，使用距离平方倒数法和按方位加权平均法自动生成格网模型并交互。
          </p>
        </Link>

        <a
          href="https://xiaotianxt.com"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className={`${inter.className} mb-3 text-2xl font-semibold`}>
            课程报告{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p
            className={`${inter.className} m-0 max-w-[30ch] text-sm opacity-50`}
          >
            点击浏览课程报告。
          </p>
        </a>
      </div>
    </main>
  );
}
