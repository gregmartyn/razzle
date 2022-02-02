import React, { useState, useEffect, useMemo } from 'react'
import cn from 'classnames'
import Slugger from 'github-slugger'
import { Link, useParams } from 'react-router-dom'
import { useActiveAnchor } from './misc/active-anchor'
import { getFSRoute } from './utils/get-fs-route'
import useMenuContext from './utils/menu-context'
import Search from './search'
import StorkSearch from './stork-search'
import { useConfig } from './config'
import getHeadingText from './utils/getHeadingText'
import { Heading } from 'nextra'
import { Item, PageItem } from './utils/normalize-pages'

const TreeState: Record<string, boolean> = {}

interface FolderProps {
  item: PageItem | Item
  anchors: string[]
}

function Folder({ item, anchors }: FolderProps) {
  const { asPath, locale } = useParams()
  const routeOriginal = getFSRoute(asPath, locale)
  const route = routeOriginal.split('#')[0]
  const active = route === item.route + '/' || route + '/' === item.route + '/'
  const { defaultMenuCollapsed } = useMenuContext()
  const open = TreeState[item.route] ?? !defaultMenuCollapsed
  const [_, render] = useState(false)

  useEffect(() => {
    if (active) {
      TreeState[item.route] = true
    }
  }, [active])

  return (
    <li className={open ? 'active' : ''}>
      <button
        onClick={() => {
          if (active) return
          TreeState[item.route] = !open
          render(x => !x)
        }}
      >
        {item.title}
      </button>
      <div
        style={{
          display: open ? 'initial' : 'none'
        }}
      >
        {Array.isArray(item.children) && (
          <Menu
            directories={item.children}
            base={item.route}
            anchors={anchors}
          />
        )}
      </div>
    </li>
  )
}
interface FileProps {
  item: PageItem | Item
  anchors: string[]
}
function File({ item, anchors }: FileProps) {
  const { setMenu } = useMenuContext()
  const { asPath, locale } = useParams()
  const route = getFSRoute(asPath, locale)
  const active = route === item.route + '/' || route + '/' === item.route + '/'
  const slugger = new Slugger()
  const activeAnchor = useActiveAnchor()

  const title = item.title
  // if (item.title.startsWith('> ')) {
  // title = title.substr(2)
  if (anchors && anchors.length) {
    if (active) {
      let activeIndex = 0
      const anchorInfo = anchors.map((anchor, i) => {
        const text = anchor
        const slug = slugger.slug(text)
        if (activeAnchor[slug] && activeAnchor[slug].isActive) {
          activeIndex = i
        }
        return { text, slug }
      })
      return (
        <li className={active ? 'active' : ''}>
          <Link to={item.route}>
            <a>{title}</a>
          </Link>
          <ul>
            {anchors.map((_, i) => {
              const { slug, text } = anchorInfo[i]
              const isActive = i === activeIndex

              return (
                <li key={`a-${slug}`}>
                  <a
                    href={'#' + slug}
                    onClick={() => setMenu(false)}
                    className={isActive ? 'active-anchor' : ''}
                  >
                    <span className="flex text-sm">
                      <span className="opacity-25">#</span>
                      <span className="mr-2"></span>
                      <span className="inline-block">{text}</span>
                    </span>
                  </a>
                </li>
              )
            })}
          </ul>
        </li>
      )
    }
  }

  return (
    <li className={active ? 'active' : ''}>
      <Link to={item.route}>
        <a onClick={() => setMenu(false)}>{title}</a>
      </Link>
    </li>
  )
}
interface MenuProps {
  directories: PageItem[] | Item[]
  anchors: string[]
  base?: string
}
const emptyItem: any[] = []
function Menu({ directories, anchors }: MenuProps) {
  return (
    <ul>
      {directories.map(item => {
        if (item.children) {
          return <Folder key={item.name} item={item} anchors={anchors} />
        }
        return <File key={item.name} item={item} anchors={anchors} />
      })}
    </ul>
  )
}

interface SideBarProps {
  directories: PageItem[]
  flatDirectories: Item[]
  fullDirectories: Item[]
  mdShow?: boolean
  headings?: Heading[]
}
const emptyHeading: any[] = []
export default function Sidebar({
  directories,
  flatDirectories,
  fullDirectories,
  mdShow = true,
  headings = emptyHeading
}: SideBarProps) {
  const config = useConfig()
  const anchors = useMemo(
    () =>
      headings
        .filter(v => v.children && v.depth === 2 && v.type === 'heading')
        .map(v => getHeadingText(v))
        .filter(Boolean),
    [headings]
  )
  const { menu } = useMenuContext()
  useEffect(() => {
    if (menu) {
      document.body.classList.add('overflow-hidden')
    } else {
      document.body.classList.remove('overflow-hidden')
    }
  }, [menu])

  return (
    <aside
      className={cn(
        'fixed h-screen bg-white dark:bg-dark flex-shrink-0 w-full md:w-64 md:sticky z-20',
        menu ? '' : 'hidden',
        mdShow ? 'md:block' : ''
      )}
      style={{
        top: '4rem',
        height: 'calc(100vh - 4rem)'
      }}
    >
      <div className="sidebar border-gray-200 dark:border-gray-900 w-full p-4 pb-40 md:pb-16 h-full overflow-y-auto">
        <div className="mb-4 block md:hidden">
          {config.customSearch ||
            (config.search ? (
              config.unstable_stork ? (
                <StorkSearch />
              ) : (
                <Search directories={flatDirectories} />
              )
            ) : null)}
        </div>
        <div className="hidden md:block">
          <Menu
            directories={directories}
            anchors={
              // When the viewport size is larger than `md`, hide the anchors in
              // the sidebar when `floatTOC` is enabled.
              config.floatTOC ? [] : anchors
            }
          />
        </div>
        <div className="md:hidden">
          <Menu
            directories={fullDirectories}
            anchors={
              // Always show the anchor links on mobile (`md`).
              anchors
            }
          />
        </div>
      </div>
    </aside>
  )
}