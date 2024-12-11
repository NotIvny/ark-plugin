## 文件替换与备份功能

`#ark创建备份`

创建备份时，需提供ID和以下两个文件夹路径：

src path: 替换用的文件所在的文件夹。

dest path: 被替换的文件所在的文件夹，即需要备份的文件所在的文件夹。

以上路径均为基于云崽根目录的绝对路径

创建备份后，插件会自动获取src path下的所有文件名，并储存在backup.json中，以后仅这些文件会被替换，备份文件将储存于backup文件夹中(以下称 dest-backup-path )。

注意: 与常规备份插件不同，本插件额外提供了一个"替换文件"的功能(src path => dest path)，以安全地修改插件代码，关系图如下所示。

src path => dest path <=> dest-backup path

如无需使用替换文件功能，请将 src path 和 dest path 都指定为需要备份的文件所在的文件夹

`#ark删除备份`

删除备份数据，src path 与 dest-backup path 都会被删除

`#ark替换文件`

将 src path 中的文件复制到 dest path 中。

`#ark备份文件`

使用 dest path 中的文件复制到 dest-backup path 中。

`#ark恢复文件`

使用 dest-backup path 中的文件复制到 dest path 中。