import { ChonkyIconName, ChonkyIconProps } from "@aperturerobotics/chonky"
import {
  IconAlertTriangle,
  IconArrowDown,
  IconBolt,
  IconBrandDebian,
  IconBrandGit,
  IconBrandNodejs,
  IconBrandPhp,
  IconBrandPython,
  IconBrandRust,
  IconBrandUbuntu,
  IconBrandWindows,
  IconChevronDown,
  IconChevronRight,
  IconClipboardText,
  IconCopy,
  IconCornerRightUp,
  IconDatabase,
  IconDeselect,
  IconDownload,
  IconExternalLink,
  IconEyeOff,
  IconFile,
  IconFileCode,
  IconFileSpreadsheet,
  IconFileText,
  IconFileTypeDocx,
  IconFileTypePdf,
  IconFileZip,
  IconFolder,
  IconFolderOpen,
  IconFolderPlus,
  IconHandGrab,
  IconInfoCircle,
  IconKey,
  IconLicense,
  IconList,
  IconLoader2,
  IconLock,
  IconMinus,
  IconMovie,
  IconMusic,
  IconPackageExport,
  IconPackages,
  IconPhoto,
  IconSearch,
  IconSelectAll,
  IconSettings,
  IconShare,
  IconSortAscendingLetters,
  IconSortDescendingLetters,
  IconTableFilled,
  IconTerminal,
  IconToggleLeft,
  IconToggleRight,
  IconTrash,
  IconUpload,
  IconUsers,
  IconX,
  TablerIconsProps,
} from "@tabler/icons-react"
import { Icon, IconProps } from "@tremor/react"
import React from "react"

type TablerIcon = (props: TablerIconsProps) => JSX.Element

const IconMap: {
  [iconName in ChonkyIconName]: TablerIcon
} = {
  // Misc
  [ChonkyIconName.loading]: IconLoader2,
  [ChonkyIconName.dropdown]: IconChevronDown,
  [ChonkyIconName.placeholder]: IconMinus,

  // File Actions: Drag & drop
  [ChonkyIconName.dndDragging]: IconHandGrab,
  [ChonkyIconName.dndCanDrop]: IconArrowDown,
  [ChonkyIconName.dndCannotDrop]: IconX,

  // File Actions: File operations
  [ChonkyIconName.openFiles]: IconPackageExport,
  [ChonkyIconName.openParentFolder]: IconCornerRightUp,
  [ChonkyIconName.copy]: IconCopy,
  [ChonkyIconName.paste]: IconClipboardText,
  [ChonkyIconName.share]: IconShare,
  [ChonkyIconName.search]: IconSearch,
  [ChonkyIconName.selectAllFiles]: IconSelectAll,
  [ChonkyIconName.clearSelection]: IconDeselect,

  // File Actions: Sorting & options
  [ChonkyIconName.sortAsc]: IconSortAscendingLetters,
  [ChonkyIconName.sortDesc]: IconSortDescendingLetters,
  [ChonkyIconName.toggleOn]: IconToggleLeft,
  [ChonkyIconName.toggleOff]: IconToggleRight,

  // File Actions: File Views
  [ChonkyIconName.list]: IconList,
  [ChonkyIconName.compact]: IconList,
  [ChonkyIconName.smallThumbnail]: IconTableFilled,
  [ChonkyIconName.largeThumbnail]: IconTableFilled,

  // File Actions: Unsorted
  [ChonkyIconName.folder]: IconFolder,
  [ChonkyIconName.folderCreate]: IconFolderPlus,
  [ChonkyIconName.folderOpen]: IconFolderOpen,
  [ChonkyIconName.folderChainSeparator]: IconChevronRight,
  [ChonkyIconName.download]: IconDownload,
  [ChonkyIconName.upload]: IconUpload,
  [ChonkyIconName.trash]: IconTrash,
  [ChonkyIconName.fallbackIcon]: IconAlertTriangle,

  // File modifiers
  [ChonkyIconName.symlink]: IconExternalLink,
  [ChonkyIconName.hidden]: IconEyeOff,

  // Generic file types
  [ChonkyIconName.file]: IconFile,
  [ChonkyIconName.license]: IconLicense,
  [ChonkyIconName.code]: IconFileCode,
  [ChonkyIconName.config]: IconSettings,
  [ChonkyIconName.model]: IconPackages,
  [ChonkyIconName.database]: IconDatabase,
  [ChonkyIconName.text]: IconFileText,
  [ChonkyIconName.archive]: IconFileZip,
  [ChonkyIconName.image]: IconPhoto,
  [ChonkyIconName.video]: IconMovie,
  [ChonkyIconName.info]: IconInfoCircle,
  [ChonkyIconName.key]: IconKey,
  [ChonkyIconName.lock]: IconLock,
  [ChonkyIconName.music]: IconMusic,
  [ChonkyIconName.terminal]: IconTerminal,
  [ChonkyIconName.users]: IconUsers,

  // OS file types
  [ChonkyIconName.linux]: IconBrandDebian,
  [ChonkyIconName.ubuntu]: IconBrandUbuntu,
  [ChonkyIconName.windows]: IconBrandWindows,

  // Programming language file types
  [ChonkyIconName.rust]: IconBrandRust,
  [ChonkyIconName.python]: IconBrandPython,
  [ChonkyIconName.nodejs]: IconBrandNodejs,
  [ChonkyIconName.php]: IconBrandPhp,

  // Development tools file types
  [ChonkyIconName.git]: IconBrandGit,

  // Other program file types
  [ChonkyIconName.pdf]: IconFileTypePdf,
  [ChonkyIconName.excel]: IconFileSpreadsheet,
  [ChonkyIconName.word]: IconFileTypeDocx,
  [ChonkyIconName.flash]: IconBolt,
} as const

export const ChonkyIconsTabler: React.FC<ChonkyIconProps> = React.memo(props => {
  const { icon } = props

  let tablerIcon: TablerIcon
  if (typeof icon === "object") {
    tablerIcon = icon
  } else {
    tablerIcon = IconMap[icon as keyof typeof IconMap] ?? IconMap.fallbackIcon
  }

  // Fixes React warnings since some props are custom to Chonky and MUI
  const { fixedWidth, spin, ...cleanProps } = props
  const tablerProps: IconProps = {
    ...cleanProps,
    icon: tablerIcon,
  } as const
  return <Icon className="p-0 align-text-bottom" color="gray" {...tablerProps} />
})
