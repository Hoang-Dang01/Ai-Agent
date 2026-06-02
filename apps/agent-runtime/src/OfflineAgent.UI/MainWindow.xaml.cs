using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Windows;
using System.Windows.Controls;
using OfflineAgent.Core.Plugins;
using System.Windows.Media;

namespace OfflineAgent.UI
{
    public partial class MainWindow : Window
    {
        private List<Plugin> _plugins = new List<Plugin>();
        private Plugin? _selectedPlugin;
        private PluginSkill? _selectedSkill;
        private PluginCommand? _selectedCommand;
        private string _activePluginsDirectory = string.Empty;
        private OfflineAgent.Core.Vision.LocalVisionModel? _localVisionModel;

        public MainWindow()
        {
            InitializeComponent();
            Loaded += MainWindow_Loaded;
        }

        private void MainWindow_Loaded(object sender, RoutedEventArgs e)
        {
            LoadAllPlugins();
        }

        private void LoadAllPlugins()
        {
            string rootDir = AppDomain.CurrentDomain.BaseDirectory;
            string[] potentialPaths = new[]
            {
                Path.Combine(rootDir, "plugins"),
                Path.Combine(rootDir, "..", "..", "..", "..", "plugins"),
                Path.Combine(rootDir, "..", "..", "..", "..", "knowledge", "plugins"),
                Path.Combine(rootDir, "..", "..", "..", "..", "knowledge-work-plugins"),
                Path.Combine(rootDir, "..", "..", "..", "..", "src", "knowledge-work-plugins"),
                Path.Combine(rootDir, "..", "..", "..", "..", "..", "plugins"),
                Path.Combine(rootDir, "..", "..", "..", "..", "..", "knowledge", "plugins"),
                Path.Combine(rootDir, "..", "..", "..", "..", "..", "knowledge-work-plugins"),
                Path.Combine(rootDir, "..", "..", "..", "..", "..", "src", "knowledge-work-plugins")
            };

            // Xác định thư mục ghi đè/tạo mới plugin chính thức
            _activePluginsDirectory = potentialPaths.FirstOrDefault(Directory.Exists) ?? Path.Combine(rootDir, "plugins");

            _plugins.Clear();
            var loader = new PluginLoader();
            var checkedPaths = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var path in potentialPaths)
            {
                try
                {
                    string fullPath = Path.GetFullPath(path);
                    if (Directory.Exists(fullPath) && checkedPaths.Add(fullPath))
                    {
                        var loaded = loader.LoadPlugins(fullPath);
                        foreach (var plugin in loaded)
                        {
                            // Tránh nạp trùng lặp plugin trùng ID
                            if (!_plugins.Any(p => p.Manifest.Id.Equals(plugin.Manifest.Id, StringComparison.OrdinalIgnoreCase)))
                            {
                                _plugins.Add(plugin);
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[WPF Engine] Cảnh báo lỗi quét đường dẫn '{path}': {ex.Message}");
                }
            }

            // Thêm các phòng ban lập trình sẵn bằng C# trực tiếp vào danh sách hiển thị
            var eng = new EngineeringPlugin();
            _plugins.Add(new Plugin
            {
                Manifest = new PluginManifest
                {
                    Id = eng.Id,
                    Name = eng.Name,
                    Description = eng.Description,
                    Version = eng.Version,
                    Icon = "code",
                    Commands = eng.GetCommands().Select(c => new PluginCommand
                    {
                        Name = c.Trigger,
                        Description = c.Description,
                        Prompt = c.Prompt
                    }).ToList()
                },
                Skills = new List<PluginSkill>
                {
                    new PluginSkill { Name = "standards", Content = eng.GetSystemInstructions(), FilePath = "[Embedded Resource]" }
                },
                DirectoryPath = "[Embedded C# Executable Plugin]"
            });

            var sales = new SalesPlugin();
            _plugins.Add(new Plugin
            {
                Manifest = new PluginManifest
                {
                    Id = sales.Id,
                    Name = sales.Name,
                    Description = sales.Description,
                    Version = sales.Version,
                    Icon = "sales",
                    Commands = sales.GetCommands().Select(c => new PluginCommand
                    {
                        Name = c.Trigger,
                        Description = c.Description,
                        Prompt = c.Prompt
                    }).ToList()
                },
                Skills = new List<PluginSkill>
                {
                    new PluginSkill { Name = "security", Content = sales.GetSystemInstructions(), FilePath = "[Embedded Resource]" }
                },
                DirectoryPath = "[Embedded C# Executable Plugin]"
            });

            var autoAgent = new AutonomousAgent();
            _plugins.Add(new Plugin
            {
                Manifest = new PluginManifest
                {
                    Id = autoAgent.Id,
                    Name = autoAgent.Name,
                    Description = autoAgent.Description,
                    Version = autoAgent.Version,
                    Icon = "workflow",
                    Commands = autoAgent.GetCommands().Select(c => new PluginCommand
                    {
                        Name = c.Trigger,
                        Description = c.Description,
                        Prompt = c.Prompt
                    }).ToList()
                },
                Skills = new List<PluginSkill>
                {
                    new PluginSkill { Name = "capabilities", Content = autoAgent.GetSystemInstructions(), FilePath = "[Embedded Resource]" }
                },
                DirectoryPath = "[Embedded C# Executable Plugin]"
            });

            PluginsListBox.ItemsSource = null;
            PluginsListBox.ItemsSource = _plugins;

            if (_plugins.Count > 0)
            {
                StatusTextBlock.Text = $"Đã tải {_plugins.Count} phòng ban thành công.";
                EmptyStateGrid.Visibility = Visibility.Collapsed;
                PluginWorkspaceGrid.Visibility = Visibility.Visible;
                PluginsListBox.SelectedIndex = 0;
            }
            else
            {
                StatusTextBlock.Text = "Không tìm thấy phòng ban nào.";
                EmptyStateGrid.Visibility = Visibility.Visible;
                PluginWorkspaceGrid.Visibility = Visibility.Collapsed;
            }
        }

        private void OnReloadPluginsClick(object sender, RoutedEventArgs e)
        {
            LoadAllPlugins();
            MessageBox.Show("Đã tải lại danh sách các phòng ban thành công.", "Tải lại", MessageBoxButton.OK, MessageBoxImage.Information);
        }

        private void OnPluginSelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            _selectedPlugin = PluginsListBox.SelectedItem as Plugin;

            if (_selectedPlugin == null)
            {
                EmptyStateGrid.Visibility = Visibility.Visible;
                PluginWorkspaceGrid.Visibility = Visibility.Collapsed;
                return;
            }

            EmptyStateGrid.Visibility = Visibility.Collapsed;
            PluginWorkspaceGrid.Visibility = Visibility.Visible;

            // Header Info
            ActivePluginTitle.Text = _selectedPlugin.Manifest.Name;
            ActivePluginPath.Text = _selectedPlugin.DirectoryPath;

            // Form Manifest
            PluginIdTextBox.Text = _selectedPlugin.Manifest.Id;
            PluginNameTextBox.Text = _selectedPlugin.Manifest.Name;
            PluginVersionTextBox.Text = _selectedPlugin.Manifest.Version;
            PluginIconTextBox.Text = _selectedPlugin.Manifest.Icon;
            PluginDescTextBox.Text = _selectedPlugin.Manifest.Description;

            // Bind Skills
            SkillsListBox.ItemsSource = null;
            SkillsListBox.ItemsSource = _selectedPlugin.Skills;
            SkillEditorGrid.Visibility = Visibility.Collapsed;

            // Bind Commands
            CommandsListBox.ItemsSource = null;
            CommandsListBox.ItemsSource = _selectedPlugin.Manifest.Commands;
            CommandEditorGrid.Visibility = Visibility.Collapsed;
        }

        #region Manifest Actions

        private void OnSaveManifestClick(object sender, RoutedEventArgs e)
        {
            if (_selectedPlugin == null) return;

            try
            {
                _selectedPlugin.Manifest.Name = PluginNameTextBox.Text;
                _selectedPlugin.Manifest.Version = PluginVersionTextBox.Text;
                _selectedPlugin.Manifest.Icon = PluginIconTextBox.Text;
                _selectedPlugin.Manifest.Description = PluginDescTextBox.Text;

                SaveManifestFile(_selectedPlugin);
                ActivePluginTitle.Text = _selectedPlugin.Manifest.Name;
                PluginsListBox.Items.Refresh();

                MessageBox.Show("Đã lưu cấu hình chung của phòng ban thành công.", "Thành công", MessageBoxButton.OK, MessageBoxImage.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Lỗi khi lưu cấu hình: {ex.Message}", "Lỗi", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private void SaveManifestFile(Plugin plugin)
        {
            string manifestPath = Path.Combine(plugin.DirectoryPath, ".claude-plugin", "plugin.json");
            if (!File.Exists(manifestPath))
            {
                manifestPath = Path.Combine(plugin.DirectoryPath, "plugin.json");
            }

            // Đảm bảo thư mục cha tồn tại
            string parentDir = Path.GetDirectoryName(manifestPath) ?? plugin.DirectoryPath;
            if (!Directory.Exists(parentDir))
            {
                Directory.CreateDirectory(parentDir);
            }

            var options = new JsonSerializerOptions { WriteIndented = true };
            string json = JsonSerializer.Serialize(plugin.Manifest, options);
            File.WriteAllText(manifestPath, json);
        }

        #endregion

        #region Skills Actions

        private void OnSkillSelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            _selectedSkill = SkillsListBox.SelectedItem as PluginSkill;

            if (_selectedSkill == null)
            {
                SkillEditorGrid.Visibility = Visibility.Collapsed;
                return;
            }

            SkillEditorGrid.Visibility = Visibility.Visible;
            SkillNameTextBox.Text = _selectedSkill.Name;
            SkillContentTextBox.Text = _selectedSkill.Content;
        }

        private void OnSaveSkillClick(object sender, RoutedEventArgs e)
        {
            if (_selectedPlugin == null || _selectedSkill == null) return;

            try
            {
                string oldName = _selectedSkill.Name;
                string newName = SkillNameTextBox.Text.Trim();

                if (string.IsNullOrEmpty(newName))
                {
                    MessageBox.Show("Tên file kỹ năng không được phép trống.", "Cảnh báo", MessageBoxButton.OK, MessageBoxImage.Warning);
                    return;
                }

                _selectedSkill.Content = SkillContentTextBox.Text;

                string skillsDir = Path.Combine(_selectedPlugin.DirectoryPath, "skills");
                string oldFilePath = _selectedSkill.FilePath;
                string newFilePath = Path.Combine(skillsDir, $"{newName}.md");

                // Nếu đổi tên, thực hiện đổi tên tệp tin vật lý
                if (oldName != newName)
                {
                    if (File.Exists(newFilePath))
                    {
                        MessageBox.Show("Tên file kỹ năng này đã tồn tại trong phòng ban này.", "Cảnh báo", MessageBoxButton.OK, MessageBoxImage.Warning);
                        return;
                    }

                    if (File.Exists(oldFilePath))
                    {
                        File.Delete(oldFilePath);
                    }

                    _selectedSkill.Name = newName;
                    _selectedSkill.FilePath = newFilePath;
                }

                // Ghi đè tệp tin
                File.WriteAllText(newFilePath, _selectedSkill.Content);
                SkillsListBox.Items.Refresh();

                MessageBox.Show("Đã lưu tệp tin kỹ năng Markdown thành công.", "Thành công", MessageBoxButton.OK, MessageBoxImage.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Lỗi khi lưu file skill: {ex.Message}", "Lỗi", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private void OnAddNewSkillClick(object sender, RoutedEventArgs e)
        {
            if (_selectedPlugin == null) return;

            // Prompt simple input using custom dark-mode InputDialog
            string skillName = InputDialog.Prompt(this, "Nhập tên kỹ năng mới (Ví dụ: pricing):", "Thêm Kỹ Năng Mới", "new-skill").Trim();
            if (string.IsNullOrEmpty(skillName)) return;

            string skillsDir = Path.Combine(_selectedPlugin.DirectoryPath, "skills");
            if (!Directory.Exists(skillsDir))
            {
                Directory.CreateDirectory(skillsDir);
            }

            string filePath = Path.Combine(skillsDir, $"{skillName}.md");
            if (File.Exists(filePath))
            {
                MessageBox.Show("Tên file kỹ năng này đã tồn tại.", "Cảnh báo", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            try
            {
                string defaultText = $"# HƯỚNG DẪN KỸ NĂNG: {skillName.ToUpper()}\n\nNhập quy trình nghiệp vụ và tri thức chi tiết của phòng ban tại đây...";
                File.WriteAllText(filePath, defaultText);

                var newSkill = new PluginSkill
                {
                    Name = skillName,
                    Content = defaultText,
                    FilePath = filePath
                };

                _selectedPlugin.Skills.Add(newSkill);
                SkillsListBox.ItemsSource = null;
                SkillsListBox.ItemsSource = _selectedPlugin.Skills;
                SkillsListBox.SelectedItem = newSkill;

                MessageBox.Show($"Đã tạo mới file kỹ năng '{skillName}.md' thành công.", "Thành công", MessageBoxButton.OK, MessageBoxImage.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Lỗi khi tạo kỹ năng mới: {ex.Message}", "Lỗi", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private void OnDeleteSkillClick(object sender, RoutedEventArgs e)
        {
            if (_selectedPlugin == null || _selectedSkill == null) return;

            var result = MessageBox.Show($"Bạn có chắc chắn muốn xóa vĩnh viễn tệp kỹ năng '{_selectedSkill.Name}.md' không?", 
                "Xác nhận xóa", MessageBoxButton.YesNo, MessageBoxImage.Warning);
            
            if (result == MessageBoxResult.Yes)
            {
                try
                {
                    if (File.Exists(_selectedSkill.FilePath))
                    {
                        File.Delete(_selectedSkill.FilePath);
                    }

                    _selectedPlugin.Skills.Remove(_selectedSkill);
                    SkillsListBox.ItemsSource = null;
                    SkillsListBox.ItemsSource = _selectedPlugin.Skills;
                    SkillEditorGrid.Visibility = Visibility.Collapsed;

                    MessageBox.Show("Đã xóa file kỹ năng thành công.", "Đã xóa", MessageBoxButton.OK, MessageBoxImage.Information);
                }
                catch (Exception ex)
                {
                    MessageBox.Show($"Lỗi khi xóa file: {ex.Message}", "Lỗi", MessageBoxButton.OK, MessageBoxImage.Error);
                }
            }
        }

        #endregion

        #region Commands Actions

        private void OnCommandSelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            _selectedCommand = CommandsListBox.SelectedItem as PluginCommand;

            if (_selectedCommand == null)
            {
                CommandEditorGrid.Visibility = Visibility.Collapsed;
                return;
            }

            CommandEditorGrid.Visibility = Visibility.Visible;
            CommandNameTextBox.Text = _selectedCommand.Name;
            CommandDescTextBox.Text = _selectedCommand.Description;
            CommandPromptTextBox.Text = _selectedCommand.Prompt;
        }

        private void OnSaveCommandClick(object sender, RoutedEventArgs e)
        {
            if (_selectedPlugin == null || _selectedCommand == null) return;

            try
            {
                string newName = CommandNameTextBox.Text.Trim();
                if (string.IsNullOrEmpty(newName))
                {
                    MessageBox.Show("Cú pháp lệnh không được phép để trống.", "Cảnh báo", MessageBoxButton.OK, MessageBoxImage.Warning);
                    return;
                }

                _selectedCommand.Name = newName;
                _selectedCommand.Description = CommandDescTextBox.Text;
                _selectedCommand.Prompt = CommandPromptTextBox.Text;

                SaveManifestFile(_selectedPlugin);
                CommandsListBox.Items.Refresh();

                MessageBox.Show("Đã lưu thay đổi cho lệnh thành công.", "Thành công", MessageBoxButton.OK, MessageBoxImage.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Lỗi khi lưu lệnh: {ex.Message}", "Lỗi", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private void OnAddNewCommandClick(object sender, RoutedEventArgs e)
        {
            if (_selectedPlugin == null) return;

            string cmdName = InputDialog.Prompt(this, "Nhập cú pháp Slash Command mới (Ví dụ: /sales:prep):", "Thêm Lệnh Mới", "/new-command").Trim();
            if (string.IsNullOrEmpty(cmdName)) return;

            if (_selectedPlugin.Manifest.Commands.Any(c => c.Name == cmdName))
            {
                MessageBox.Show("Lệnh này đã được đăng ký trong phòng ban này rồi.", "Cảnh báo", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            try
            {
                var newCmd = new PluginCommand
                {
                    Name = cmdName,
                    Description = "Mô tả công việc thực thi của lệnh...",
                    Prompt = "Hãy phân tích yêu cầu nghiệp vụ và..."
                };

                _selectedPlugin.Manifest.Commands.Add(newCmd);
                SaveManifestFile(_selectedPlugin);

                CommandsListBox.ItemsSource = null;
                CommandsListBox.ItemsSource = _selectedPlugin.Manifest.Commands;
                CommandsListBox.SelectedItem = newCmd;

                MessageBox.Show($"Đã đăng ký lệnh '{cmdName}' thành công.", "Thành công", MessageBoxButton.OK, MessageBoxImage.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Lỗi khi đăng ký lệnh mới: {ex.Message}", "Lỗi", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private void OnDeleteCommandClick(object sender, RoutedEventArgs e)
        {
            if (_selectedPlugin == null || _selectedCommand == null) return;

            var result = MessageBox.Show($"Bạn có chắc chắn muốn hủy đăng ký lệnh '{_selectedCommand.Name}' không?", 
                "Xác nhận xóa", MessageBoxButton.YesNo, MessageBoxImage.Warning);

            if (result == MessageBoxResult.Yes)
            {
                try
                {
                    _selectedPlugin.Manifest.Commands.Remove(_selectedCommand);
                    SaveManifestFile(_selectedPlugin);

                    CommandsListBox.ItemsSource = null;
                    CommandsListBox.ItemsSource = _selectedPlugin.Manifest.Commands;
                    CommandEditorGrid.Visibility = Visibility.Collapsed;

                    MessageBox.Show("Đã xóa đăng ký lệnh thành công.", "Đã xóa", MessageBoxButton.OK, MessageBoxImage.Information);
                }
                catch (Exception ex)
                {
                    MessageBox.Show($"Lỗi khi xóa lệnh: {ex.Message}", "Lỗi", MessageBoxButton.OK, MessageBoxImage.Error);
                }
            }
        }

        #endregion

        #region Prompt Preview Window

        private void OnPreviewPromptClick(object sender, RoutedEventArgs e)
        {
            if (_selectedPlugin == null) return;

            if (_selectedPlugin.Manifest.Commands.Count == 0)
            {
                MessageBox.Show("Vui lòng đăng ký ít nhất một phím tắt lệnh để chạy ghép nối Prompt.", "Cảnh báo", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            // Mặc định chọn lệnh đầu tiên nếu chưa chọn lệnh cụ thể
            var cmd = _selectedCommand ?? _selectedPlugin.Manifest.Commands[0];

            string agentsDoctrine = "";
            string rootDir = AppDomain.CurrentDomain.BaseDirectory;
            string agentsMdPath = Path.Combine(rootDir, "AGENTS.md");
            if (!File.Exists(agentsMdPath))
            {
                agentsMdPath = Path.Combine(rootDir, "..", "..", "..", "..", "AGENTS.md");
            }
            if (File.Exists(agentsMdPath))
            {
                agentsDoctrine = File.ReadAllText(agentsMdPath);
            }

            var builder = new PluginPromptBuilder();
            string finalPrompt = builder.BuildSystemPrompt(_selectedPlugin, cmd, agentsDoctrine);

            // Hiển thị ra một cửa sổ popup Scrollable để xem chi tiết
            var previewWin = new Window
            {
                Title = $"Prompt Assembly Preview - {cmd.Name}",
                Width = 750,
                Height = 550,
                Background = new SolidColorBrush(Color.FromRgb(30, 30, 30)),
                Foreground = new SolidColorBrush(Color.FromRgb(224, 224, 224)),
                WindowStartupLocation = WindowStartupLocation.CenterOwner,
                Owner = this
            };

            var grid = new Grid { Margin = new Thickness(15) };
            grid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
            grid.RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) });

            var titleText = new TextBlock
            {
                Text = $"Bộ Prompt hệ thống được lắp ghép hoàn chỉnh cho lệnh: {cmd.Name}",
                FontSize = 14,
                FontWeight = FontWeights.Bold,
                Foreground = new SolidColorBrush(Color.FromRgb(0, 122, 204)),
                Margin = new Thickness(0, 0, 0, 10)
            };

            var txtBox = new TextBox
            {
                Text = finalPrompt,
                IsReadOnly = true,
                TextWrapping = TextWrapping.Wrap,
                AcceptsReturn = true,
                VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
                FontFamily = new FontFamily("Consolas"),
                FontSize = 12,
                Background = new SolidColorBrush(Color.FromRgb(24, 24, 24)),
                Foreground = new SolidColorBrush(Color.FromRgb(180, 180, 180)),
                BorderBrush = new SolidColorBrush(Color.FromRgb(45, 45, 45)),
                Padding = new Thickness(10)
            };

            grid.Children.Add(titleText);
            grid.Children.Add(txtBox);
            Grid.SetRow(titleText, 0);
            Grid.SetRow(txtBox, 1);

            previewWin.Content = grid;
            previewWin.ShowDialog();
        }

        private void OnCreateNewPluginClick(object sender, RoutedEventArgs e)
        {
            string pluginId = InputDialog.Prompt(this, "Nhập ID phòng ban mới (viết liền không dấu, ví dụ: marketing-dept):", "Tạo Phòng Ban Mới", "new-dept").Trim();
            if (string.IsNullOrEmpty(pluginId)) return;

            string newPluginDir = Path.Combine(_activePluginsDirectory, pluginId);
            if (Directory.Exists(newPluginDir))
            {
                MessageBox.Show("ID phòng ban này đã tồn tại trong hệ thống.", "Cảnh báo", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            try
            {
                Directory.CreateDirectory(newPluginDir);
                Directory.CreateDirectory(Path.Combine(newPluginDir, ".claude-plugin"));
                Directory.CreateDirectory(Path.Combine(newPluginDir, "skills"));

                var newManifest = new PluginManifest
                {
                    Id = pluginId,
                    Name = $"{pluginId.ToUpper()} Department",
                    Description = "Phòng ban nghiệp vụ tự động...",
                    Version = "1.0.0",
                    Icon = "briefcase",
                    Commands = new List<PluginCommand>
                    {
                        new PluginCommand
                        {
                            Name = $"/{pluginId.Split('-')[0]}:run",
                            Description = "Thực thi tác vụ cốt lõi của phòng ban này...",
                            Prompt = "Hãy phân tích và hoàn tất..."
                        }
                    }
                };

                // Lưu manifest
                string manifestPath = Path.Combine(newPluginDir, ".claude-plugin", "plugin.json");
                var options = new JsonSerializerOptions { WriteIndented = true };
                string json = JsonSerializer.Serialize(newManifest, options);
                File.WriteAllText(manifestPath, json);

                // Lưu một file skill mặc định
                string defaultSkillPath = Path.Combine(newPluginDir, "skills", "overview.md");
                File.WriteAllText(defaultSkillPath, $"# HƯỚNG DẪN TỔNG QUAN PHÒNG BAN {pluginId.ToUpper()}\n\nĐịnh nghĩa tài liệu nghiệp vụ chi tiết tại đây...");

                MessageBox.Show($"Đã tạo mới phòng ban '{pluginId}' thành công. Đang tải lại danh sách...", "Thành công", MessageBoxButton.OK, MessageBoxImage.Information);
                LoadAllPlugins();

                // Select newly created plugin
                var targetPlugin = _plugins.FirstOrDefault(p => p.Manifest.Id == pluginId);
                if (targetPlugin != null)
                {
                    PluginsListBox.SelectedItem = targetPlugin;
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Lỗi khi tạo phòng ban mới: {ex.Message}", "Lỗi", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private async void OnRunCommandClick(object sender, RoutedEventArgs e)
        {
            if (_selectedPlugin == null || _selectedCommand == null) return;

            // Kiểm tra xem lệnh này có mã nguồn C# thực thi hay không
            IAgentCommand? executableCmd = null;
            if (_selectedPlugin.Manifest.Id == "engineering-csharp")
            {
                executableCmd = new EngineeringPlugin().GetCommands().FirstOrDefault(c => c.Trigger == _selectedCommand.Name);
            }
            else if (_selectedPlugin.Manifest.Id == "sales-csharp")
            {
                executableCmd = new SalesPlugin().GetCommands().FirstOrDefault(c => c.Trigger == _selectedCommand.Name);
            }
            else if (_selectedPlugin.Manifest.Id == "autonomous-agent")
            {
                executableCmd = new AutonomousAgent().GetCommands().FirstOrDefault(c => c.Trigger == _selectedCommand.Name);
            }

            if (executableCmd == null)
            {
                MessageBox.Show("Đây là một lệnh prompt tĩnh (chưa được cấu hình mã nguồn C# thực thi).", "Thông báo", MessageBoxButton.OK, MessageBoxImage.Information);
                return;
            }

            try
            {
                // Mở cửa sổ hiển thị Log chạy tự động hóa Matrix Style
                var logWin = new Window
                {
                    Title = $"Đang thực thi Lệnh C# - {executableCmd.Trigger}",
                    Width = 650,
                    Height = 450,
                    Background = new SolidColorBrush(Color.FromRgb(20, 20, 20)),
                    Foreground = new SolidColorBrush(Color.FromRgb(0, 255, 0)),
                    WindowStartupLocation = WindowStartupLocation.CenterOwner,
                    Owner = this
                };

                var txtLog = new TextBox
                {
                    IsReadOnly = true,
                    TextWrapping = TextWrapping.Wrap,
                    AcceptsReturn = true,
                    VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
                    FontFamily = new FontFamily("Consolas"),
                    FontSize = 12,
                    Background = new SolidColorBrush(Color.FromRgb(15, 15, 15)),
                    Foreground = new SolidColorBrush(Color.FromRgb(0, 255, 64)), // Green neon matrix!
                    BorderBrush = new SolidColorBrush(Color.FromRgb(45, 45, 45)),
                    Padding = new Thickness(10)
                };

                logWin.Content = txtLog;
                logWin.Show(); // Hiển thị song song không chặn màn hình chính

                // Khởi động helper tự động hóa
                var helper = new OfflineAgent.Core.Automation.WindowAutomationHelper();
                var context = new AgentContext(
                    helper,
                    log => {
                        Dispatcher.Invoke(() => {
                            txtLog.AppendText(log + "\n");
                            txtLog.ScrollToEnd();
                        });
                    },
                    async prompt => {
                        try
                        {
                            Dispatcher.Invoke(() => {
                                txtLog.AppendText("[Local LLM] Đang nạp/kiểm tra mô hình Qwen2.5 ONNX (1.5B INT4 lượng hóa) trong RAM...\n");
                                txtLog.ScrollToEnd();
                            });

                            if (_localVisionModel == null)
                            {
                                string rootDir = AppDomain.CurrentDomain.BaseDirectory;
                                string[] potentialPaths = new[]
                                {
                                    Path.Combine(rootDir, "models", "Qwen2.5-1.5B-Instruct", "onnx"),
                                    Path.Combine(rootDir, "..", "..", "..", "..", "models", "Qwen2.5-1.5B-Instruct", "onnx"),
                                    Path.Combine(rootDir, "..", "..", "..", "..", "..", "models", "Qwen2.5-1.5B-Instruct", "onnx")
                                };
                                string modelPath = potentialPaths.FirstOrDefault(Directory.Exists) ?? string.Empty;

                                if (string.IsNullOrEmpty(modelPath))
                                {
                                    string err = "[LOCAL LLM ERROR] Không tìm thấy thư mục mô hình ONNX tại 'models\\Qwen2.5-1.5B-Instruct\\onnx\\'. Hãy kiểm tra lại tệp tin tải về.";
                                    Dispatcher.Invoke(() => {
                                        txtLog.AppendText(err + "\n");
                                        txtLog.ScrollToEnd();
                                    });
                                    return err;
                                }

                                _localVisionModel = new OfflineAgent.Core.Vision.LocalVisionModel(modelPath);
                                _localVisionModel.Load();
                            }

                            Dispatcher.Invoke(() => {
                                txtLog.AppendText("[Local LLM] Đang trích xuất tri thức phòng ban và ghép nối Prompt...\n");
                                txtLog.ScrollToEnd();
                            });

                            // Xây dựng System Prompt kết hợp tri thức phòng ban và tri thức cốt lõi AGENTS.md
                            var builder = new PluginPromptBuilder();
                            string agentsDoctrine = "";
                            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                            string agentsMdPath = Path.Combine(baseDir, "AGENTS.md");
                            if (!File.Exists(agentsMdPath))
                            {
                                agentsMdPath = Path.Combine(baseDir, "..", "..", "..", "..", "AGENTS.md");
                            }
                            if (File.Exists(agentsMdPath))
                            {
                                agentsDoctrine = File.ReadAllText(agentsMdPath);
                            }

                            string systemPrompt = builder.BuildSystemPrompt(_selectedPlugin, _selectedCommand, agentsDoctrine);

                            Dispatcher.Invoke(() => {
                                txtLog.AppendText("[Local LLM] Bắt đầu suy luận ngoại tuyến (Streaming Tokens):\n--------------------------------------------------\n");
                                txtLog.ScrollToEnd();
                            });

                            var response = await _localVisionModel.GenerateTextAsync(systemPrompt, prompt, piece =>
                            {
                                Dispatcher.Invoke(() => {
                                    txtLog.AppendText(piece);
                                    txtLog.ScrollToEnd();
                                });
                            });

                            Dispatcher.Invoke(() => {
                                txtLog.AppendText("\n--------------------------------------------------\n[Local LLM] Hoàn tất suy luận ngoại tuyến thành công.\n");
                                txtLog.ScrollToEnd();
                            });

                            return response;
                        }
                        catch (Exception ex)
                        {
                            string err = $"[LOCAL LLM EXCEPTION] Lỗi suy luận mô hình: {ex.Message}";
                            Dispatcher.Invoke(() => {
                                txtLog.AppendText(err + "\n");
                                txtLog.ScrollToEnd();
                            });
                            return err;
                        }
                    }
                )
                {
                    PromptUser = (question, title) =>
                    {
                        return Dispatcher.Invoke(() =>
                        {
                            return InputDialog.Prompt(this, question, title);
                        });
                    }
                };

                // Chạy ngầm trong Thread riêng biệt để tránh đơ giao diện WPF
                await Task.Run(async () => {
                    try
                    {
                        await executableCmd.ExecuteAsync(context);
                        context.Logger("\n[System] >>> THỰC THI LỆNH HOÀN TẤT THÀNH CÔNG <<<");
                    }
                    catch (Exception ex)
                    {
                        context.Logger($"\n[System] Lỗi nghiêm trọng: {ex.Message}");
                    }
                    finally
                    {
                        helper.Dispose();
                    }
                });
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Lỗi khi khởi động tiến trình thực thi: {ex.Message}", "Lỗi", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        protected override void OnClosed(EventArgs e)
        {
            base.OnClosed(e);
            try
            {
                _localVisionModel?.Dispose();
            }
            catch { }
        }

        #endregion
    }
}