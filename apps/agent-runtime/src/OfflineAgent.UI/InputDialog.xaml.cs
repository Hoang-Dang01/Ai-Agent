using System.Windows;
using System.Windows.Input;

namespace OfflineAgent.UI
{
    public partial class InputDialog : Window
    {
        public string Answer { get; private set; } = string.Empty;

        public InputDialog(string question, string title, string defaultValue = "")
        {
            InitializeComponent();
            Title = title;
            PromptLabel.Text = question;
            InputTextBox.Text = defaultValue;
            InputTextBox.Focus();
            InputTextBox.SelectAll();
        }

        public static string Prompt(Window owner, string question, string title, string defaultValue = "")
        {
            var dialog = new InputDialog(question, title, defaultValue)
            {
                Owner = owner
            };
            if (dialog.ShowDialog() == true)
            {
                return dialog.Answer;
            }
            return string.Empty;
        }

        private void OnOkClick(object sender, RoutedEventArgs e)
        {
            Answer = InputTextBox.Text;
            DialogResult = true;
            Close();
        }

        private void OnCancelClick(object sender, RoutedEventArgs e)
        {
            DialogResult = false;
            Close();
        }

        private void InputTextBox_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Enter)
            {
                OnOkClick(sender, e);
            }
            else if (e.Key == Key.Escape)
            {
                OnCancelClick(sender, e);
            }
        }
    }
}
