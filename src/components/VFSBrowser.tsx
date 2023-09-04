import {
  ChonkyActions,
  ChonkyFileActionData,
  FileArray,
  FileBrowserProps,
  FileData,
  FileHelper,
  FullFileBrowser,
} from "@aperturerobotics/chonky"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { ChonkyIconsTabler } from "components/VFSBrowserIcons"
import { CouchdbAttachmentsWithExclusiveUnion } from "types"

// We define a custom interface for file data because we want to add some custom fields
// to Chonky's built-in `FileData` interface.
export interface CustomFileData extends FileData {
  parentId?: string
  childrenIds?: string[]
}
export interface CustomFileMap {
  [fileId: string]: CustomFileData
}

const prepareCustomFileMap = (attachments: CouchdbAttachmentsWithExclusiveUnion, rootFolderId: string) => {
  const map: CustomFileMap = {}

  Object.entries(attachments).forEach(([filename, attachment]) => {
    const pieces = filename.split("/")
    pieces.forEach((piece, index) => {
      const parent = pieces[index - 1] ?? rootFolderId
      if (!map[parent]) {
        map[parent] = {
          id: parent,
          name: parent,
          isDir: true,
          openable: true,
          childrenIds: [],
        }
      }
      map[parent].childrenIds?.push(piece)

      if (!map[piece]) {
        const isLeaf = index === pieces.length - 1
        map[piece] = {
          id: piece,
          name: piece,
          isDir: !isLeaf,
          openable: !isLeaf,
          childrenIds: [],
          parentId: parent,

          ...(isLeaf && {
            size: attachment.length,
            ext: attachment.content_type,
          }),
        }
      }
    })
  })

  return { baseFileMap: map }
}

// Hook that sets up our file map and defines functions used to mutate - `deleteFiles`,
// `moveFiles`, and so on.
const useCustomFileMap = (attachments: CouchdbAttachmentsWithExclusiveUnion, rootFolderId: string) => {
  const { baseFileMap } = useMemo(() => prepareCustomFileMap(attachments, rootFolderId), [attachments, rootFolderId])

  // Setup the React state for our file map and the current folder.
  const [fileMap, setFileMap] = useState(baseFileMap)
  const [currentFolderId, setCurrentFolderId] = useState(rootFolderId)

  // Setup logic to listen to changes in current folder ID without having to update
  // `useCallback` hooks. Read more about it here:
  // https://reactjs.org/docs/hooks-faq.html#is-there-something-like-instance-variables
  const currentFolderIdRef = useRef(currentFolderId)
  useEffect(() => {
    currentFolderIdRef.current = currentFolderId
  }, [currentFolderId])

  // Function that will be called when user deletes files either using the toolbar
  // button or `Delete` key.
  const deleteFiles = useCallback((files: CustomFileData[]) => {
    // We use the so-called "functional update" to set the new file map. This
    // lets us access the current file map value without having to track it
    // explicitly. Read more about it here:
    // https://reactjs.org/docs/hooks-reference.html#functional-updates
    setFileMap((currentFileMap: CustomFileMap) => {
      // Create a copy of the file map to make sure we don't mutate it.
      const newFileMap = { ...currentFileMap }

      files.forEach(file => {
        // Delete file from the file map.
        delete newFileMap[file.id]

        // Update the parent folder to make sure it doesn't try to load the
        // file we just deleted.
        if (file.parentId) {
          const parent = newFileMap[file.parentId]

          const newChildrenIds = (parent.childrenIds ?? []).filter((id: string) => id !== file.id)
          newFileMap[file.parentId] = {
            ...parent,
            childrenIds: newChildrenIds,
            childrenCount: newChildrenIds.length,
          }
        }
      })

      return newFileMap
    })
  }, [])

  // Function that will be called when files are moved from one folder to another
  // using drag & drop.
  const moveFiles = useCallback((files: CustomFileData[], source: CustomFileData, destination: CustomFileData) => {
    setFileMap((currentFileMap: CustomFileMap) => {
      const newFileMap = { ...currentFileMap }
      const moveFileIds = new Set(files.map(f => f.id))

      // Delete files from their source folder.
      const newSourceChildrenIds = (source.childrenIds ?? []).filter(id => !moveFileIds.has(id))
      newFileMap[source.id] = {
        ...source,
        childrenIds: newSourceChildrenIds,
        childrenCount: newSourceChildrenIds.length,
      }

      // Add the files to their destination folder.
      const newDestinationChildrenIds = [...(destination.childrenIds ?? []), ...files.map(f => f.id)]
      newFileMap[destination.id] = {
        ...destination,
        childrenIds: newDestinationChildrenIds,
        childrenCount: newDestinationChildrenIds.length,
      }

      // Finally, update the parent folder ID on the files from source folder
      // ID to the destination folder ID.
      files.forEach(file => {
        newFileMap[file.id] = {
          ...file,
          parentId: destination.id,
        }
      })

      return newFileMap
    })
  }, [])

  // Function that will be called when user creates a new folder using the toolbar
  // button. That that we use incremental integer IDs for new folder, but this is
  // not a good practice in production! Instead, you should use something like UUIDs
  // or MD5 hashes for file paths.
  const createFolder = useCallback((folderName: string) => {
    setFileMap((currentFileMap: CustomFileMap) => {
      const newFileMap = { ...currentFileMap }

      // Create the new folder
      if (folderName in newFileMap) {
        return newFileMap
      }

      newFileMap[folderName] = {
        id: folderName,
        name: folderName,
        isDir: true,
        modDate: new Date(),
        parentId: currentFolderIdRef.current,
        childrenIds: [],
        childrenCount: 0,
      }

      // Update parent folder to reference the new folder.
      const parent = newFileMap[currentFolderIdRef.current]
      newFileMap[currentFolderIdRef.current] = {
        ...parent,
        childrenIds: [...(parent.childrenIds ?? []), folderName],
      }

      return newFileMap
    })
  }, [])

  return {
    fileMap,
    currentFolderId,
    setCurrentFolderId,
    deleteFiles,
    moveFiles,
    createFolder,
  }
}

export const useFiles = (fileMap: CustomFileMap, currentFolderId: string): FileArray => {
  return useMemo(() => {
    const currentFolder = fileMap[currentFolderId]
    if (!currentFolder) {
      return []
    }

    const childrenIds = currentFolder.childrenIds
    if (!childrenIds) {
      return []
    }

    const files = childrenIds.map((fileId: string) => fileMap[fileId])
    return files
  }, [currentFolderId, fileMap])
}

export const useFolderChain = (fileMap: CustomFileMap, currentFolderId: string): FileArray => {
  return useMemo(() => {
    const currentFolder = fileMap[currentFolderId]
    if (!currentFolder) {
      return []
    }

    const folderChain = [currentFolder]

    let parentId = currentFolder.parentId
    while (parentId) {
      const parentFile = fileMap[parentId]
      if (parentFile) {
        folderChain.unshift(parentFile)
        parentId = parentFile.parentId
      } else {
        break
      }
    }

    return folderChain
  }, [currentFolderId, fileMap])
}

export const useFileActionHandler = (
  setCurrentFolderId: (folderId: string) => void,
  deleteFiles: (files: CustomFileData[]) => void,
  moveFiles: (files: FileData[], source: FileData, destination: FileData) => void,
  createFolder: (folderName: string) => void
) => {
  return useCallback(
    (data: ChonkyFileActionData) => {
      if (data.id === ChonkyActions.OpenFiles.id) {
        const { targetFile, files } = data.payload
        const fileToOpen = targetFile ?? files[0]
        if (fileToOpen && FileHelper.isDirectory(fileToOpen)) {
          setCurrentFolderId(fileToOpen.id)
          return
        }
      } else if (data.id === ChonkyActions.DeleteFiles.id) {
        deleteFiles(data.state.selectedFilesForAction)
      } else if (data.id === ChonkyActions.MoveFiles.id) {
        data.payload.source && moveFiles(data.payload.files, data.payload.source, data.payload.destination)
      } else if (data.id === ChonkyActions.CreateFolder.id) {
        const folderName = prompt("Provide the name for your new folder:")
        if (folderName) {
          createFolder(folderName)
        }
      }
    },
    [createFolder, deleteFiles, moveFiles, setCurrentFolderId]
  )
}

export type VFSProps = Partial<FileBrowserProps> & {
  attachments: CouchdbAttachmentsWithExclusiveUnion
  rootFolderName?: string
}

export const VFSBrowser = React.memo((props: VFSProps) => {
  const { fileMap, currentFolderId, setCurrentFolderId, deleteFiles, moveFiles, createFolder } = useCustomFileMap(
    props.attachments,
    props.rootFolderName ?? "attachments"
  )
  const files = useFiles(fileMap, currentFolderId)
  const folderChain = useFolderChain(fileMap, currentFolderId)
  const handleFileAction = useFileActionHandler(setCurrentFolderId, deleteFiles, moveFiles, createFolder)
  const fileActions = useMemo(() => [ChonkyActions.CreateFolder, ChonkyActions.DeleteFiles], [])

  return (
    <FullFileBrowser
      theme={{
        margins: {
          rootLayoutMargin: 0,
        },
        root: {
          borderStyle: "none",
        },
      }}
      muiThemeOptions={{}}
      files={files}
      iconComponent={ChonkyIconsTabler}
      folderChain={folderChain}
      fileActions={fileActions}
      onFileAction={handleFileAction}
      {...props}
    />
  )
})
