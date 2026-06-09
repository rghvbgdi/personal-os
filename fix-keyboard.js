const fs = require('fs');
const path = require('path');

const walk = (dir, callback) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) walk(fullPath, callback);
    else if (fullPath.endsWith('.js')) callback(fullPath);
  }
};

walk(path.join(__dirname, 'app-frontend/src/screens'), (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. Transparent Modals (Tasks, Notes, Calendar, Placement, Sleep)
  content = content.replace(
    /<KeyboardAvoidingView\s+behavior=\{Platform\.OS === 'ios' \? 'padding' : 'height'\}\s+style=\{styles\.modalOverlay\}\s*>/g,
    '<View style={styles.modalOverlay}>\n          <KeyboardAvoidingView behavior={Platform.OS === \'ios\' ? \'padding\' : undefined}>'
  );
  content = content.replace(
    /<\/ScrollView>\n\s*<\/View>\n\s*<\/KeyboardAvoidingView>\n\s*<\/Modal>/g,
    '</ScrollView>\n          </View>\n          </KeyboardAvoidingView>\n        </View>\n      </Modal>'
  );

  // 2. PageSheet Modals (Expenses, Goals)
  content = content.replace(
    /<KeyboardAvoidingView behavior=\{Platform\.OS === 'ios' \? 'padding' : undefined\} style=\{\{ flex: 1 \}\}>/g,
    '<View style={{ flex: 1 }}>'
  );
  content = content.replace(
    /<\/ScrollView>\n\s*<\/View>\n\s*<\/KeyboardAvoidingView>\n\s*<\/View>\n\s*<\/Modal>/g,
    '</ScrollView>\n        </View>\n      </View>\n    </Modal>'
  );
  content = content.replace(
    /<\/ScrollView>\n\s*<\/KeyboardAvoidingView>\n\s*<\/View>\n\s*<\/Modal>/g,
    '</ScrollView>\n        </View>\n      </Modal>'
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed:', filePath);
  }
});
